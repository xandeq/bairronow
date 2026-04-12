using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class AccountService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<AccountService> _logger;

    public AccountService(AppDbContext db, IEmailService emailService, ILogger<AccountService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<object> BuildExportAsync(Guid userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var posts = await _db.Posts.AsNoTracking()
            .Where(p => p.AuthorId == userId)
            .Select(p => new { p.Id, p.Body, p.Category, p.CreatedAt })
            .ToListAsync();

        var comments = await _db.Comments.AsNoTracking()
            .Where(c => c.AuthorId == userId)
            .Select(c => new { c.Id, c.Body, c.PostId, c.CreatedAt })
            .ToListAsync();

        var listings = await _db.Listings.AsNoTracking()
            .Where(l => l.SellerId == userId)
            .Select(l => new { l.Id, l.Title, l.Description, l.Price, l.Status, l.CreatedAt })
            .ToListAsync();

        var messages = await _db.Messages.AsNoTracking()
            .Where(m => m.SenderId == userId)
            .Select(m => new { m.Id, m.Text, m.SentAt, m.ConversationId })
            .ToListAsync();

        var verifications = await _db.Verifications.IgnoreQueryFilters().AsNoTracking()
            .Where(v => v.UserId == userId)
            .Select(v => new { v.Id, v.Cep, v.Status, v.SubmittedAt, v.ReviewedAt })
            .ToListAsync();

        var notifications = await _db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .Select(n => new { n.Id, n.Type, n.IsRead, n.CreatedAt })
            .ToListAsync();

        // Update last export timestamp
        var userEntity = await _db.Users.FindAsync(userId);
        if (userEntity != null)
        {
            userEntity.LastExportAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return new
        {
            profile = new
            {
                user.Id,
                user.Email,
                user.DisplayName,
                user.Bio,
                user.PhotoUrl,
                user.BairroId,
                user.IsVerified,
                user.EmailConfirmed,
                user.CreatedAt,
                user.UpdatedAt
            },
            posts,
            comments,
            listings,
            messages,
            verifications,
            notifications,
            exportedAt = DateTime.UtcNow
        };
    }

    public async Task RequestDeletionAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        user.DeleteRequestedAt = DateTime.UtcNow;
        user.IsActive = false;

        // Revoke all refresh tokens
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync();
        foreach (var token in tokens)
            token.IsRevoked = true;

        // Delete verification documents immediately
        var verifications = await _db.Verifications.IgnoreQueryFilters()
            .Where(v => v.UserId == userId && v.ProofFilePath != "" && v.DocumentDeletedAt == null)
            .ToListAsync();

        foreach (var v in verifications)
        {
            try
            {
                if (File.Exists(v.ProofFilePath))
                    File.Delete(v.ProofFilePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete proof file {Path}", v.ProofFilePath);
            }
            v.ProofFilePath = "";
            v.DocumentDeletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _emailService.SendAccountDeletionConfirmationAsync(user.Email);
        _logger.LogInformation("Deletion requested for user {UserId}", userId);
    }

    public async Task<bool> CancelDeletionAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return false;

        if (user.DeleteRequestedAt == null)
            return false;

        if (user.DeleteRequestedAt < DateTime.UtcNow.AddDays(-30))
            return false; // Grace period expired

        user.DeleteRequestedAt = null;
        user.IsActive = true;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deletion cancelled for user {UserId}", userId);
        return true;
    }

    public async Task RunAnonymizationAsync()
    {
        var cutoff = DateTime.UtcNow.AddDays(-30);
        var usersToAnonymize = await _db.Users
            .Where(u => u.DeleteRequestedAt != null && u.DeleteRequestedAt < cutoff && u.DeletedAt == null)
            .ToListAsync();

        foreach (var user in usersToAnonymize)
        {
            user.Email = $"deleted+{Guid.NewGuid()}@bairronow.com.br";
            user.DisplayName = "Usuario removido";
            user.PhotoUrl = null;
            user.Bio = null;
            user.PasswordHash = "";
            user.DeletedAt = DateTime.UtcNow;
            user.TotpSecret = null;
            user.TotpBackupCodes = null;
            user.GoogleId = null;
        }

        if (usersToAnonymize.Any())
        {
            await _db.SaveChangesAsync();
            _logger.LogInformation("Anonymized {Count} users past 30-day grace period", usersToAnonymize.Count);
        }
    }
}
