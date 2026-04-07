using System.Text.RegularExpressions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public class CommentService : ICommentService
{
    private static readonly Regex MentionRegex = new(@"@([A-Za-z0-9_.\-]{3,})", RegexOptions.Compiled);

    private readonly AppDbContext _db;
    private readonly IOffensiveWordFilter _filter;
    private readonly INotificationService _notifications;
    private readonly IValidator<CreateCommentRequest> _validator;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        AppDbContext db,
        IOffensiveWordFilter filter,
        INotificationService notifications,
        IValidator<CreateCommentRequest> validator,
        ILogger<CommentService> logger)
    {
        _db = db;
        _filter = filter;
        _notifications = notifications;
        _validator = validator;
        _logger = logger;
    }

    public async Task<CommentDto> CreateAsync(Guid authorId, CreateCommentRequest dto, CancellationToken ct = default)
    {
        var author = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == authorId, ct)
            ?? throw new FeedForbiddenException("Usuário não encontrado.");
        if (!author.IsVerified) throw new FeedForbiddenException("Usuário não verificado.");

        var validation = await _validator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            throw new FeedValidationException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        if (_filter.Contains(dto.Body))
            throw new FeedValidationException("Comentário contém palavras proibidas.");

        var post = await _db.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == dto.PostId, ct)
            ?? throw new FeedNotFoundException("Post não encontrado.");
        if (author.BairroId != post.BairroId)
            throw new FeedForbiddenException("Comentários restritos ao bairro do post.");

        Comment? parent = null;
        if (dto.ParentCommentId.HasValue)
        {
            parent = await _db.Comments.AsNoTracking().FirstOrDefaultAsync(c => c.Id == dto.ParentCommentId.Value, ct)
                ?? throw new FeedNotFoundException("Comentário pai não encontrado.");
            if (parent.ParentCommentId != null)
                throw new FeedValidationException("Respostas aninhadas não permitidas (apenas 1 nível).");
        }

        var comment = new Comment
        {
            PostId = dto.PostId,
            AuthorId = authorId,
            ParentCommentId = dto.ParentCommentId,
            Body = dto.Body.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "comment.create",
            EntityType = "Comment",
            EntityId = comment.Id.ToString(),
            UserId = authorId,
            IpAddress = "system"
        });
        await _db.SaveChangesAsync(ct);

        // Notify post author
        if (post.AuthorId != authorId)
            await _notifications.NotifyCommentAsync(post.AuthorId, authorId, post.Id, comment.Id, ct);

        // Notify parent comment author for replies
        if (parent != null && parent.AuthorId != authorId && parent.AuthorId != post.AuthorId)
            await _notifications.NotifyReplyAsync(parent.AuthorId, authorId, post.Id, comment.Id, ct);

        // Mention scanning: @displayname
        var mentions = MentionRegex.Matches(dto.Body)
            .Select(m => m.Groups[1].Value)
            .Distinct()
            .ToList();
        if (mentions.Count > 0)
        {
            var mentionedUsers = await _db.Users.AsNoTracking()
                .Where(u => u.DisplayName != null && mentions.Contains(u.DisplayName))
                .Select(u => u.Id)
                .ToListAsync(ct);
            foreach (var uid in mentionedUsers)
            {
                if (uid != authorId)
                    await _notifications.NotifyMentionAsync(uid, authorId, post.Id, comment.Id, ct);
            }
        }

        return new CommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            Author = new PostAuthorDto
            {
                Id = author.Id,
                DisplayName = author.DisplayName,
                PhotoUrl = author.PhotoUrl,
                IsVerified = author.IsVerified
            },
            Body = comment.Body,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task<CommentDto> UpdateAsync(Guid authorId, int commentId, string body, CancellationToken ct = default)
    {
        var comment = await _db.Comments.Include(c => c.Author).FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new FeedNotFoundException("Comentário não encontrado.");
        if (comment.AuthorId != authorId) throw new FeedForbiddenException("Apenas o autor pode editar.");
        if (string.IsNullOrWhiteSpace(body) || body.Length > 500)
            throw new FeedValidationException("Corpo inválido.");
        if (_filter.Contains(body))
            throw new FeedValidationException("Comentário contém palavras proibidas.");

        comment.Body = body.Trim();
        comment.EditedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new CommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId,
            Author = new PostAuthorDto
            {
                Id = comment.AuthorId,
                DisplayName = comment.Author?.DisplayName,
                PhotoUrl = comment.Author?.PhotoUrl,
                IsVerified = comment.Author?.IsVerified ?? false
            },
            Body = comment.Body,
            CreatedAt = comment.CreatedAt,
            EditedAt = comment.EditedAt
        };
    }

    public async Task DeleteAsync(Guid authorId, int commentId, CancellationToken ct = default)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new FeedNotFoundException("Comentário não encontrado.");
        if (comment.AuthorId != authorId) throw new FeedForbiddenException("Apenas o autor pode remover.");
        comment.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<CommentDto>> GetByPostAsync(int postId, CancellationToken ct = default)
    {
        var all = await _db.Comments.AsNoTracking()
            .Include(c => c.Author)
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);
        return all.Where(c => c.ParentCommentId == null)
            .Select(c => FeedQueryService.MapComment(c, all))
            .ToList();
    }
}
