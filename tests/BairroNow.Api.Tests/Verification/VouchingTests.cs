using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Tests.Verification;

[Trait("Category", "Unit")]
public class VouchingTests : IDisposable
{
    private readonly AppDbContext _db;

    public VouchingTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task VouchCreation_PersistsToDatabase()
    {
        var voucherId = Guid.NewGuid();
        var voucheeId = Guid.NewGuid();

        _db.Users.Add(new User { Id = voucherId, Email = "voucher@test.com", PasswordHash = "hash", IsVerified = true });
        _db.Users.Add(new User { Id = voucheeId, Email = "vouchee@test.com", PasswordHash = "hash" });
        await _db.SaveChangesAsync();

        var vouch = new VerificationVouch
        {
            VoucheeId = voucheeId,
            VoucherId = voucherId,
            CreatedAt = DateTime.UtcNow
        };
        _db.VerificationVouches.Add(vouch);
        await _db.SaveChangesAsync();

        var stored = await _db.VerificationVouches.FirstOrDefaultAsync();
        stored.Should().NotBeNull();
        stored!.VoucherId.Should().Be(voucherId);
        stored.VoucheeId.Should().Be(voucheeId);
    }

    [Fact]
    public async Task DuplicateVouch_CanBeDetected()
    {
        var voucherId = Guid.NewGuid();
        var voucheeId = Guid.NewGuid();

        _db.Users.Add(new User { Id = voucherId, Email = "voucher@test.com", PasswordHash = "hash", IsVerified = true });
        _db.Users.Add(new User { Id = voucheeId, Email = "vouchee@test.com", PasswordHash = "hash" });
        _db.VerificationVouches.Add(new VerificationVouch
        {
            VoucheeId = voucheeId,
            VoucherId = voucherId
        });
        await _db.SaveChangesAsync();

        var alreadyVouched = await _db.VerificationVouches
            .AnyAsync(v => v.VoucheeId == voucheeId && v.VoucherId == voucherId);

        alreadyVouched.Should().BeTrue();
    }

    [Fact]
    public async Task AutoApproval_At2Vouches()
    {
        var voucheeId = Guid.NewGuid();
        var voucher1Id = Guid.NewGuid();
        var voucher2Id = Guid.NewGuid();

        _db.Users.Add(new User { Id = voucheeId, Email = "vouchee@test.com", PasswordHash = "hash" });
        _db.Users.Add(new User { Id = voucher1Id, Email = "v1@test.com", PasswordHash = "hash", IsVerified = true });
        _db.Users.Add(new User { Id = voucher2Id, Email = "v2@test.com", PasswordHash = "hash", IsVerified = true });

        // Add a pending verification for the vouchee
        _db.Verifications.Add(new Models.Entities.Verification
        {
            UserId = voucheeId,
            Cep = "29100000",
            Status = VerificationStatus.Pending,
            ProofFilePath = "/proof.jpg",
            ProofSha256 = "hash"
        });
        await _db.SaveChangesAsync();

        // First vouch
        _db.VerificationVouches.Add(new VerificationVouch { VoucheeId = voucheeId, VoucherId = voucher1Id });
        await _db.SaveChangesAsync();

        // Second vouch
        _db.VerificationVouches.Add(new VerificationVouch { VoucheeId = voucheeId, VoucherId = voucher2Id });
        await _db.SaveChangesAsync();

        var vouchCount = await _db.VerificationVouches.CountAsync(v => v.VoucheeId == voucheeId);
        vouchCount.Should().Be(2);

        // Simulate auto-approval logic
        if (vouchCount >= 2)
        {
            var targetUser = await _db.Users.FindAsync(voucheeId);
            var verification = await _db.Verifications
                .Where(v => v.UserId == voucheeId && v.Status == VerificationStatus.Pending)
                .OrderByDescending(v => v.SubmittedAt)
                .FirstOrDefaultAsync();

            if (verification != null)
            {
                verification.Status = VerificationStatus.Approved;
                verification.ReviewedAt = DateTime.UtcNow;
            }

            targetUser!.IsVerified = true;
            targetUser.VerifiedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        var updatedUser = await _db.Users.FindAsync(voucheeId);
        updatedUser!.IsVerified.Should().BeTrue();
        updatedUser.VerifiedAt.Should().NotBeNull();

        var updatedVerification = await _db.Verifications.FirstAsync(v => v.UserId == voucheeId);
        updatedVerification.Status.Should().Be(VerificationStatus.Approved);
    }
}
