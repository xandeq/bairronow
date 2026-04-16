using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class LikeService : ILikeService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;

    public LikeService(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<LikeToggleResult> ToggleAsync(Guid userId, int postId, CancellationToken ct = default)
    {
        var post = await _db.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == postId, ct)
            ?? throw new FeedNotFoundException("Post não encontrado.");

        var existing = await _db.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId, ct);
        bool liked;
        if (existing != null)
        {
            _db.PostLikes.Remove(existing);
            liked = false;
        }
        else
        {
            _db.PostLikes.Add(new PostLike { PostId = postId, UserId = userId, CreatedAt = DateTime.UtcNow });
            liked = true;
        }
        await _db.SaveChangesAsync(ct);

        var count = await _db.PostLikes.AsNoTracking().CountAsync(l => l.PostId == postId, ct);

        if (liked && post.AuthorId != userId)
            await _notifications.NotifyLikeAsync(post.AuthorId, userId, postId, ct);

        return new LikeToggleResult { Liked = liked, Count = count };
    }

    public async Task<List<PostAuthorDto>> WhoLikedAsync(int postId, CancellationToken ct = default)
    {
        return await _db.PostLikes.AsNoTracking()
            .Where(l => l.PostId == postId)
            .Include(l => l.User)
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .Select(l => new PostAuthorDto
            {
                Id = l.UserId,
                DisplayName = l.User!.DisplayName,
                PhotoUrl = l.User.PhotoUrl,
                IsVerified = l.User.IsVerified
            })
            .ToListAsync(ct);
    }
}
