using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class PostService : IPostService
{
    private const int MaxImages = 4;
    private static readonly TimeSpan EditWindow = TimeSpan.FromMinutes(30);

    private readonly AppDbContext _db;
    private readonly IFileStorageService _files;
    private readonly IOffensiveWordFilter _filter;
    private readonly IValidator<CreatePostRequest> _validator;
    private readonly ILogger<PostService> _logger;

    public PostService(
        AppDbContext db,
        IFileStorageService files,
        IOffensiveWordFilter filter,
        IValidator<CreatePostRequest> validator,
        ILogger<PostService> logger)
    {
        _db = db;
        _files = files;
        _filter = filter;
        _validator = validator;
        _logger = logger;
    }

    public async Task<PostDto> CreateAsync(Guid authorId, CreatePostRequest dto, IFormFileCollection? images, CancellationToken ct = default)
    {
        var author = await _db.Users.FirstOrDefaultAsync(u => u.Id == authorId, ct)
            ?? throw new FeedForbiddenException("Usuário não encontrado.");
        if (!author.IsVerified) throw new FeedForbiddenException("Usuário não verificado.");
        if (!author.BairroId.HasValue) throw new FeedForbiddenException("Usuário sem bairro.");

        var validation = await _validator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            throw new FeedValidationException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        if (images != null && images.Count > MaxImages)
            throw new FeedValidationException($"Máximo {MaxImages} imagens por post.");

        var isOffensive = _filter.Contains(dto.Body);

        var post = new Post
        {
            AuthorId = authorId,
            BairroId = author.BairroId.Value,
            Category = dto.Category,
            Body = dto.Body.Trim(),
            IsFlagged = isOffensive,
            IsPublished = !isOffensive,
            CreatedAt = DateTime.UtcNow
        };

        if (images != null)
        {
            int order = 0;
            foreach (var file in images)
            {
                if (file.Length == 0) continue;
                using var stream = file.OpenReadStream();
                var url = await _files.SaveImageAsync(stream, file.FileName, file.ContentType, "posts", ct);
                post.Images.Add(new PostImage { Url = url, Order = order++ });
            }
        }

        _db.Posts.Add(post);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "post.create",
            EntityType = "Post",
            EntityId = post.Id.ToString(),
            UserId = authorId,
            IpAddress = "system",
            Details = $"flagged={isOffensive}; images={post.Images.Count}"
        });
        await _db.SaveChangesAsync(ct);

        post.Author = author;
        return FeedQueryService.MapPost(post,
            new Dictionary<int, int> { [post.Id] = 0 },
            new HashSet<int>(),
            new Dictionary<int, int> { [post.Id] = 0 });
    }

    public async Task<PostDto> UpdateAsync(Guid authorId, int postId, string body, CancellationToken ct = default)
    {
        var post = await _db.Posts.Include(p => p.Author).Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == postId, ct)
            ?? throw new FeedNotFoundException("Post não encontrado.");
        if (post.AuthorId != authorId) throw new FeedForbiddenException("Apenas o autor pode editar.");
        if (DateTime.UtcNow - post.CreatedAt > EditWindow)
            throw new FeedValidationException("Janela de edição de 30 minutos expirou.");
        if (string.IsNullOrWhiteSpace(body) || body.Length > 2000)
            throw new FeedValidationException("Corpo inválido.");

        var isOffensive = _filter.Contains(body);
        post.Body = body.Trim();
        post.EditedAt = DateTime.UtcNow;
        if (isOffensive)
        {
            post.IsFlagged = true;
            post.IsPublished = false;
        }

        _db.AuditLogs.Add(new AuditLog
        {
            Action = "post.update",
            EntityType = "Post",
            EntityId = post.Id.ToString(),
            UserId = authorId,
            IpAddress = "system"
        });
        await _db.SaveChangesAsync(ct);

        return FeedQueryService.MapPost(post,
            new Dictionary<int, int> { [post.Id] = 0 },
            new HashSet<int>(),
            new Dictionary<int, int> { [post.Id] = 0 });
    }

    public async Task DeleteAsync(Guid authorId, int postId, CancellationToken ct = default)
    {
        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == postId, ct)
            ?? throw new FeedNotFoundException("Post não encontrado.");
        if (post.AuthorId != authorId) throw new FeedForbiddenException("Apenas o autor pode remover.");
        post.DeletedAt = DateTime.UtcNow;
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "post.delete",
            EntityType = "Post",
            EntityId = post.Id.ToString(),
            UserId = authorId,
            IpAddress = "system"
        });
        await _db.SaveChangesAsync(ct);
    }
}
