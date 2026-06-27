using BairroNow.Api.Controllers.v1;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Models.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BairroNow.Api.Tests.Community;

// Wave P — Diretório de grupos de WhatsApp + Condomínios. Testes a nível de
// dados/lógica (mesmo estilo de GroupPollTests): InMemory DbContext + FluentAssertions.
[Trait("Category", "Unit")]
public class WhatsAppDirectoryTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static User SeedUser(AppDbContext db, bool isAdmin = false)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{Guid.NewGuid()}@test.com",
            PasswordHash = "hash",
            BairroId = 1,
            IsAdmin = isAdmin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        db.SaveChanges();
        return user;
    }

    private static WhatsAppGroup SeedGroup(AppDbContext db, User submitter,
        WhatsAppGroupStatus status = WhatsAppGroupStatus.PendingReview, int bairroId = 1)
    {
        var g = new WhatsAppGroup
        {
            BairroId = bairroId,
            Name = "Condomínio Solar",
            InviteUrl = "https://chat.whatsapp.com/ABCdef123456",
            Kind = WhatsAppGroupKind.Condominio,
            Status = status,
            SubmittedByUserId = submitter.Id,
            CreatedAt = DateTime.UtcNow,
        };
        db.WhatsAppGroups.Add(g);
        db.SaveChanges();
        return g;
    }

    // ─── Validação do link de convite ────────────────────────────────────────

    [Theory]
    [InlineData("https://chat.whatsapp.com/ABCdef123456", true)]
    [InlineData("https://chat.whatsapp.com/Kx9", false)]          // path curto demais
    [InlineData("http://chat.whatsapp.com/ABCdef123456", false)]  // não-https
    [InlineData("https://wa.me/5511999999999", false)]            // host errado
    [InlineData("https://chat.whatsapp.com", false)]              // sem path
    [InlineData("não-é-url", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidInviteUrl_EnforcesWhatsAppInviteFormat(string? url, bool expected)
    {
        WhatsAppGroupsController.IsValidInviteUrl(url).Should().Be(expected);
    }

    // ─── Submissão & moderação ───────────────────────────────────────────────

    [Fact]
    public async Task Submit_DefaultsToPendingReview()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var g = SeedGroup(db, user);

        var saved = await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id);
        saved.Status.Should().Be(WhatsAppGroupStatus.PendingReview);
        saved.IsManagedByPlatform.Should().BeFalse();
        saved.ClickCount.Should().Be(0);
    }

    [Fact]
    public async Task Verify_TransitionsToVerifiedWithTimestamp()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var admin = SeedUser(db, isAdmin: true);
        var g = SeedGroup(db, user);

        var target = await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id);
        target.Status = WhatsAppGroupStatus.Verified;
        target.VerifiedByUserId = admin.Id;
        target.VerifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var saved = await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id);
        saved.Status.Should().Be(WhatsAppGroupStatus.Verified);
        saved.VerifiedByUserId.Should().Be(admin.Id);
        saved.VerifiedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task List_ReturnsOnlyVerifiedNonDeleted()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        SeedGroup(db, user, WhatsAppGroupStatus.Verified);
        SeedGroup(db, user, WhatsAppGroupStatus.PendingReview);
        SeedGroup(db, user, WhatsAppGroupStatus.Rejected);

        var visible = await db.WhatsAppGroups
            .Where(g => g.BairroId == 1 && g.DeletedAt == null && g.Status == WhatsAppGroupStatus.Verified)
            .ToListAsync();

        visible.Should().HaveCount(1);
    }

    [Fact]
    public async Task Click_IncrementsClickCount()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var g = SeedGroup(db, user, WhatsAppGroupStatus.Verified);

        var target = await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id);
        target.ClickCount += 1;
        await db.SaveChangesAsync();

        (await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id)).ClickCount.Should().Be(1);
    }

    [Fact]
    public async Task SoftDelete_ExcludesFromDirectory()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var g = SeedGroup(db, user, WhatsAppGroupStatus.Verified);

        var target = await db.WhatsAppGroups.FirstAsync(x => x.Id == g.Id);
        target.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var visible = await db.WhatsAppGroups
            .Where(x => x.DeletedAt == null && x.Status == WhatsAppGroupStatus.Verified)
            .ToListAsync();
        visible.Should().BeEmpty();
    }

    [Fact]
    public async Task DuplicateInvite_DetectableWithinBairro()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var g = SeedGroup(db, user, WhatsAppGroupStatus.Verified);

        var isDup = await db.WhatsAppGroups
            .AnyAsync(x => x.BairroId == g.BairroId && x.InviteUrl == g.InviteUrl && x.DeletedAt == null);
        isDup.Should().BeTrue();
    }

    [Fact]
    public async Task Group_CanLinkToCondominium()
    {
        using var db = NewDb();
        var user = SeedUser(db);
        var condo = new Condominium { BairroId = 1, Name = "Ed. Solar", Status = CondominiumStatus.Unclaimed, CreatedAt = DateTime.UtcNow };
        db.Condominiums.Add(condo);
        await db.SaveChangesAsync();

        var g = new WhatsAppGroup
        {
            BairroId = 1, Name = "Grupo do Solar", InviteUrl = "https://chat.whatsapp.com/Solar123456",
            Kind = WhatsAppGroupKind.Condominio, CondominiumId = condo.Id,
            Status = WhatsAppGroupStatus.Verified, SubmittedByUserId = user.Id, CreatedAt = DateTime.UtcNow,
        };
        db.WhatsAppGroups.Add(g);
        await db.SaveChangesAsync();

        var withCondo = await db.WhatsAppGroups
            .Include(x => x.Condominium)
            .FirstAsync(x => x.Id == g.Id);
        withCondo.Condominium!.Name.Should().Be("Ed. Solar");
    }
}
