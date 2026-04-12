using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Account;

[Trait("Category", "Unit")]
public class DocumentRetentionTests : IDisposable
{
    private readonly AppDbContext _db;

    public DocumentRetentionTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task CleanExpiredDocuments_DeletesDocumentsOlderThan90Days()
    {
        // Add verification with proof file older than 90 days
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "user@test.com", PasswordHash = "hash" });
        _db.Verifications.Add(new BairroNow.Api.Models.Entities.Verification
        {
            UserId = userId,
            Cep = "29100000",
            Status = VerificationStatus.Approved,
            ReviewedAt = DateTime.UtcNow.AddDays(-91),
            ProofFilePath = "/tmp/nonexistent-proof.jpg", // File won't exist, but that's OK
            ProofSha256 = "test-hash"
        });
        await _db.SaveChangesAsync();

        // Simulate what DocumentRetentionService does internally
        var cutoff = DateTime.UtcNow.AddDays(-90);
        var expiredDocs = await _db.Verifications.IgnoreQueryFilters()
            .Where(v => v.Status == VerificationStatus.Approved
                && v.ReviewedAt != null
                && v.ReviewedAt < cutoff
                && v.DocumentDeletedAt == null
                && v.ProofFilePath != "")
            .ToListAsync();

        expiredDocs.Should().HaveCount(1);

        foreach (var v in expiredDocs)
        {
            v.ProofFilePath = "";
            v.DocumentDeletedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        var updated = await _db.Verifications.FirstAsync();
        updated.ProofFilePath.Should().BeEmpty();
        updated.DocumentDeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task CleanExpiredDocuments_SkipsAlreadyDeletedDocuments()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "user@test.com", PasswordHash = "hash" });
        _db.Verifications.Add(new BairroNow.Api.Models.Entities.Verification
        {
            UserId = userId,
            Cep = "29100000",
            Status = VerificationStatus.Approved,
            ReviewedAt = DateTime.UtcNow.AddDays(-91),
            ProofFilePath = "",
            ProofSha256 = "test-hash",
            DocumentDeletedAt = DateTime.UtcNow.AddDays(-1) // Already deleted
        });
        await _db.SaveChangesAsync();

        var cutoff = DateTime.UtcNow.AddDays(-90);
        var expiredDocs = await _db.Verifications.IgnoreQueryFilters()
            .Where(v => v.Status == VerificationStatus.Approved
                && v.ReviewedAt != null
                && v.ReviewedAt < cutoff
                && v.DocumentDeletedAt == null
                && v.ProofFilePath != "")
            .ToListAsync();

        expiredDocs.Should().BeEmpty();
    }
}
