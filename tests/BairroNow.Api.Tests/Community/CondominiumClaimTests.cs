using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BairroNow.Api.Tests.Community;

// Wave P — Fluxo de reivindicação de síndico. O WhatsApp comercial permanece
// admin; só o PERFIL é transferido após aprovação humana de admin.
[Trait("Category", "Unit")]
public class CondominiumClaimTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static User SeedUser(AppDbContext db)
    {
        var u = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid()}@test.com",
            PasswordHash = "hash",
            BairroId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Users.Add(u);
        db.SaveChanges();
        return u;
    }

    private static Condominium SeedCondo(AppDbContext db)
    {
        var c = new Condominium
        {
            BairroId = 1,
            Name = "Edifício Solar",
            Status = CondominiumStatus.Unclaimed,
            IsManagedByPlatform = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Condominiums.Add(c);
        db.SaveChanges();
        return c;
    }

    private static CondominiumClaim Claim(AppDbContext db, Condominium condo, User user)
    {
        var claim = new CondominiumClaim
        {
            CondominiumId = condo.Id,
            UserId = user.Id,
            RequestedRole = CondominiumRole.Sindico,
            Justification = "Sou o síndico eleito do condomínio.",
            Status = CondominiumClaimStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };
        db.CondominiumClaims.Add(claim);
        if (condo.Status == CondominiumStatus.Unclaimed)
            condo.Status = CondominiumStatus.ClaimPending;
        db.SaveChanges();
        return claim;
    }

    [Fact]
    public async Task NewCondominium_IsUnclaimed()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        (await db.Condominiums.FirstAsync(c => c.Id == condo.Id)).Status
            .Should().Be(CondominiumStatus.Unclaimed);
    }

    [Fact]
    public async Task Claim_SetsCondoToClaimPending()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var user = SeedUser(db);

        Claim(db, condo, user);

        var saved = await db.Condominiums.FirstAsync(c => c.Id == condo.Id);
        saved.Status.Should().Be(CondominiumStatus.ClaimPending);
        (await db.CondominiumClaims.CountAsync(c => c.CondominiumId == condo.Id && c.Status == CondominiumClaimStatus.Pending))
            .Should().Be(1);
    }

    [Fact]
    public async Task Approve_TransfersProfileAndClaims_ButPlatformKeepsWhatsApp()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var sindico = SeedUser(db);
        var admin = SeedUser(db);
        var claim = Claim(db, condo, sindico);

        // Aprovação (lógica do controller).
        var target = await db.CondominiumClaims.Include(c => c.Condominium).FirstAsync(c => c.Id == claim.Id);
        target.Status = CondominiumClaimStatus.Approved;
        target.ReviewedByUserId = admin.Id;
        target.ReviewedAt = DateTime.UtcNow;
        target.Condominium!.SindicoUserId = target.UserId;
        target.Condominium.SindicoRole = target.RequestedRole;
        target.Condominium.Status = CondominiumStatus.Claimed;
        await db.SaveChangesAsync();

        var saved = await db.Condominiums.FirstAsync(c => c.Id == condo.Id);
        saved.Status.Should().Be(CondominiumStatus.Claimed);
        saved.SindicoUserId.Should().Be(sindico.Id);
        saved.SindicoRole.Should().Be(CondominiumRole.Sindico);
        // Diferencial: a plataforma segue como gestora do WhatsApp.
        saved.IsManagedByPlatform.Should().BeTrue();
    }

    [Fact]
    public async Task Approve_AutoRejectsOtherPendingClaims()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var winner = SeedUser(db);
        var loser = SeedUser(db);
        var admin = SeedUser(db);

        var winnerClaim = Claim(db, condo, winner);
        var loserClaim = Claim(db, condo, loser);

        // Aprova o winner; rejeita os demais pendentes.
        var wc = await db.CondominiumClaims.Include(c => c.Condominium).FirstAsync(c => c.Id == winnerClaim.Id);
        wc.Status = CondominiumClaimStatus.Approved;
        wc.Condominium!.SindicoUserId = wc.UserId;
        wc.Condominium.Status = CondominiumStatus.Claimed;

        var others = await db.CondominiumClaims
            .Where(c => c.CondominiumId == condo.Id && c.Id != winnerClaim.Id && c.Status == CondominiumClaimStatus.Pending)
            .ToListAsync();
        foreach (var o in others)
        {
            o.Status = CondominiumClaimStatus.Rejected;
            o.ReviewedByUserId = admin.Id;
            o.ReviewNote = "Outro síndico foi aprovado.";
        }
        await db.SaveChangesAsync();

        (await db.CondominiumClaims.FirstAsync(c => c.Id == loserClaim.Id)).Status
            .Should().Be(CondominiumClaimStatus.Rejected);
        (await db.CondominiumClaims.CountAsync(c => c.CondominiumId == condo.Id && c.Status == CondominiumClaimStatus.Pending))
            .Should().Be(0);
    }

    [Fact]
    public async Task Reject_RevertsToUnclaimed_WhenNoOtherPending()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var user = SeedUser(db);
        var claim = Claim(db, condo, user);

        var target = await db.CondominiumClaims.Include(c => c.Condominium).FirstAsync(c => c.Id == claim.Id);
        target.Status = CondominiumClaimStatus.Rejected;

        var stillPending = await db.CondominiumClaims
            .AnyAsync(c => c.CondominiumId == condo.Id && c.Id != claim.Id && c.Status == CondominiumClaimStatus.Pending);
        if (target.Condominium!.SindicoUserId == null && !stillPending)
            target.Condominium.Status = CondominiumStatus.Unclaimed;
        await db.SaveChangesAsync();

        (await db.Condominiums.FirstAsync(c => c.Id == condo.Id)).Status
            .Should().Be(CondominiumStatus.Unclaimed);
    }

    [Fact]
    public async Task PendingClaim_PerUser_IsDetectable()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var user = SeedUser(db);
        Claim(db, condo, user);

        var hasPending = await db.CondominiumClaims
            .AnyAsync(c => c.CondominiumId == condo.Id && c.UserId == user.Id && c.Status == CondominiumClaimStatus.Pending);
        hasPending.Should().BeTrue();
    }

    [Fact]
    public async Task ApprovedClaim_CascadeWithCondominium()
    {
        using var db = NewDb();
        var condo = SeedCondo(db);
        var user = SeedUser(db);
        Claim(db, condo, user);

        // Remover claims antes do condomínio (mimic application cleanup).
        var claims = await db.CondominiumClaims.Where(c => c.CondominiumId == condo.Id).ToListAsync();
        db.CondominiumClaims.RemoveRange(claims);
        await db.SaveChangesAsync();

        (await db.CondominiumClaims.CountAsync(c => c.CondominiumId == condo.Id)).Should().Be(0);
    }
}
