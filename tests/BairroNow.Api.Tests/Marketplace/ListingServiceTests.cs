using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using BairroNow.Api.Data;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;
using BairroNow.Api.Validators;

namespace BairroNow.Api.Tests.Marketplace;

public class ListingServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static (ListingService svc, AppDbContext db, Guid sellerId) BuildSut(bool isVerified = true)
    {
        var db = NewDb();
        var sellerId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = sellerId,
            Email = "seller@example.com",
            PasswordHash = "h",
            DisplayName = "Vendedor",
            BairroId = 1,
            IsVerified = isVerified,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        db.SaveChanges();

        var fileMock = new Mock<IFileStorageService>();
        fileMock.Setup(f => f.SaveImageAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("/uploads/listings/2026/04/abc.jpg");

        var notif = new Mock<INotificationService>();
        notif.Setup(n => n.NotifyMentionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var config = new Mock<IConfiguration>();
        config.Setup(c => c.GetSection("Features")["FullTextSearchEnabled"]).Returns("false");
        var svc = new ListingService(
            db, fileMock.Object,
            new CreateListingRequestValidator(),
            new UpdateListingRequestValidator(),
            notif.Object,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<ListingService>.Instance,
            config.Object);
        return (svc, db, sellerId);
    }

    private static IFormFileCollection FakePhotos(int count)
    {
        var files = new FormFileCollection();
        for (int i = 0; i < count; i++)
        {
            var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xD9 };
            var s = new MemoryStream(bytes);
            files.Add(new FormFile(s, 0, bytes.Length, "photos", $"p{i}.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg"
            });
        }
        return files;
    }

    [Fact]
    public async Task CreateListing_With6Photos_PersistsAndWritesToDisk()
    {
        var (svc, db, sellerId) = BuildSut();
        var dto = new CreateListingRequest
        {
            Title = "Sofá usado",
            Description = "Sofá em ótimo estado vendendo por mudança",
            Price = 500m,
            CategoryCode = "moveis",
            SubcategoryCode = "sala"
        };
        var result = await svc.CreateAsync(sellerId, dto, FakePhotos(6));
        result.Photos.Should().HaveCount(6);
        var dbListing = await db.Listings.Include(l => l.Photos).FirstAsync(l => l.Id == result.Id);
        dbListing.Photos.Should().HaveCount(6);
        dbListing.BairroId.Should().Be(1);
    }

    [Fact]
    public async Task CreateListing_OnlyVerifiedUsers_Allowed()
    {
        var (svc, _, sellerId) = BuildSut(isVerified: false);
        var dto = new CreateListingRequest { Title = "x x x", Description = "abcdefghij", Price = 1, CategoryCode = "outros", SubcategoryCode = "diversos" };
        await Assert.ThrowsAsync<ListingForbiddenException>(() => svc.CreateAsync(sellerId, dto, FakePhotos(1)));
    }

    [Fact]
    public async Task UpdateListing_WritesAuditLog()
    {
        var (svc, db, sellerId) = BuildSut();
        var dto = new CreateListingRequest { Title = "Bicicleta", Description = "Bicicleta aro 26 seminova", Price = 800, CategoryCode = "esportes", SubcategoryCode = "bicicleta" };
        var created = await svc.CreateAsync(sellerId, dto, FakePhotos(1));
        await svc.UpdateAsync(sellerId, created.Id, new UpdateListingRequest { Price = 750 });
        db.AuditLogs.Where(a => a.Action == "listing.update").Should().NotBeEmpty();
    }

    [Fact]
    public async Task MarkSold_SetsSoldAt()
    {
        var (svc, db, sellerId) = BuildSut();
        var dto = new CreateListingRequest { Title = "Mesa", Description = "Mesa de jantar 6 lugares", Price = 300, CategoryCode = "moveis", SubcategoryCode = "sala" };
        var created = await svc.CreateAsync(sellerId, dto, FakePhotos(1));
        var sold = await svc.MarkSoldAsync(sellerId, created.Id);
        sold.SoldAt.Should().NotBeNull();
        sold.Status.Should().Be("sold");
    }

    [Fact]
    public async Task SoftDelete_PreservesPhotosForHistory()
    {
        var (svc, db, sellerId) = BuildSut();
        var dto = new CreateListingRequest { Title = "Cadeira", Description = "Cadeira de escritório usada", Price = 100, CategoryCode = "moveis", SubcategoryCode = "sala" };
        var created = await svc.CreateAsync(sellerId, dto, FakePhotos(2));
        await svc.DeleteAsync(sellerId, created.Id);
        var photos = await db.ListingPhotos.Where(p => p.ListingId == created.Id).ToListAsync();
        photos.Should().HaveCount(2);
    }

    // ─── Wave M regression: listing expiry ───────────────────────────────────

    [Fact]
    public async Task CreateListing_SetsExpiresAtToThirtyDays()
    {
        var (svc, _, sellerId) = BuildSut();
        var before = DateTime.UtcNow;
        var result = await svc.CreateAsync(sellerId,
            new CreateListingRequest { Title = "Teste", Description = "desc valida aqui", Price = 50, CategoryCode = "outros", SubcategoryCode = "diversos" },
            FakePhotos(1));

        result.ExpiresAt.Should().NotBeNull();
        result.ExpiresAt!.Value.Should().BeCloseTo(before.AddDays(30), TimeSpan.FromSeconds(5));
        result.DaysUntilExpiry.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RenewAsync_ExpiredListing_ReactivatesAndExtends()
    {
        var (svc, db, sellerId) = BuildSut();
        var created = await svc.CreateAsync(sellerId,
            new CreateListingRequest { Title = "Renew test", Description = "desc valida aqui", Price = 20, CategoryCode = "outros", SubcategoryCode = "diversos" },
            FakePhotos(1));

        // Simulate expiry: set ExpiresAt to past and Status to expired
        var entity = await db.Listings.FindAsync(created.Id);
        entity!.Status = ListingStatus.Expired;
        entity.ExpiresAt = DateTime.UtcNow.AddDays(-1);
        await db.SaveChangesAsync();

        var renewed = await svc.RenewAsync(sellerId, created.Id);

        renewed.Status.Should().Be("active");
        renewed.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task RenewAsync_FreshListing_ThrowsValidationException()
    {
        var (svc, _, sellerId) = BuildSut();
        var created = await svc.CreateAsync(sellerId,
            new CreateListingRequest { Title = "Fresh listing", Description = "desc valida aqui", Price = 30, CategoryCode = "outros", SubcategoryCode = "diversos" },
            FakePhotos(1));

        // Listing has 30 days remaining — renew should be blocked
        var act = () => svc.RenewAsync(sellerId, created.Id);
        await act.Should().ThrowAsync<ListingValidationException>()
            .WithMessage("*7 dias*");
    }

    [Fact]
    public async Task ToggleFavorite_ExpiredListing_ThrowsValidationException()
    {
        var (svc, db, sellerId) = BuildSut();
        var buyerId = Guid.NewGuid();
        db.Users.Add(new User { Id = buyerId, Email = "buyer@x.com", PasswordHash = "h", DisplayName = "Buyer", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var created = await svc.CreateAsync(sellerId,
            new CreateListingRequest { Title = "Expired fav test", Description = "desc valida aqui", Price = 10, CategoryCode = "outros", SubcategoryCode = "diversos" },
            FakePhotos(1));

        var entity = await db.Listings.FindAsync(created.Id);
        entity!.Status = ListingStatus.Expired;
        await db.SaveChangesAsync();

        var act = () => svc.ToggleFavoriteAsync(buyerId, created.Id);
        await act.Should().ThrowAsync<ListingValidationException>()
            .WithMessage("*expirados*");
    }

    [Fact]
    public async Task DaysUntilExpiry_UsesDateCeiling_NotTruncation()
    {
        var (svc, db, sellerId) = BuildSut();
        var created = await svc.CreateAsync(sellerId,
            new CreateListingRequest { Title = "Ceiling test", Description = "desc valida aqui", Price = 10, CategoryCode = "outros", SubcategoryCode = "diversos" },
            FakePhotos(1));

        // Set ExpiresAt to exactly 0.5 days from now — ceiling should yield 1, not 0
        var entity = await db.Listings.FindAsync(created.Id);
        entity!.ExpiresAt = DateTime.UtcNow.AddHours(12);
        await db.SaveChangesAsync();

        var dto = await svc.GetByIdAsync(sellerId, created.Id);
        dto!.DaysUntilExpiry.Should().Be(1);
    }

    // ─── Wave M hardening regression: concurrent & notification edge cases ─────

    [Fact]
    public async Task UpdateAsync_ExpiredListing_DoesNotNotifyFavoriters()
    {
        // Expired listings can be edited (seller prepares content before renewing),
        // but price-change notifications must NOT fire — favoriters should not be
        // notified about price changes on listings they can't buy anyway.
        var (svc, db, sellerId) = BuildSut();
        var notifMock = new Mock<INotificationService>();
        notifMock.Setup(n => n.NotifyMentionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Rebuild svc with the verifiable mock
        var config = new Mock<IConfiguration>();
        config.Setup(c => c.GetSection("Features")["FullTextSearchEnabled"]).Returns("false");
        var svcWithMock = new ListingService(
            db, new Mock<IFileStorageService>().Object,
            new CreateListingRequestValidator(),
            new UpdateListingRequestValidator(),
            notifMock.Object,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<ListingService>.Instance,
            config.Object);

        var buyerId = Guid.NewGuid();
        db.Users.Add(new User { Id = buyerId, Email = "buyer@x.com", PasswordHash = "h", DisplayName = "Buyer", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        // Create listing and add a favorite
        db.Listings.Add(new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "Test", Description = "desc",
            Price = 100m, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Expired, ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var listingId = db.Listings.First().Id;
        db.ListingFavorites.Add(new ListingFavorite { ListingId = listingId, UserId = buyerId, SnapshotPrice = 100m, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        // Change price on expired listing — notification must NOT fire
        await svcWithMock.UpdateAsync(sellerId, listingId, new UpdateListingRequest { Price = 50m });

        notifMock.Verify(
            n => n.NotifyMentionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_RemovedListing_ThrowsValidationException()
    {
        var (svc, db, sellerId) = BuildSut();
        db.Listings.Add(new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "Removed", Description = "desc",
            Price = 100m, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Removed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var id = db.Listings.First().Id;

        var act = () => svc.UpdateAsync(sellerId, id, new UpdateListingRequest { Price = 50m });
        await act.Should().ThrowAsync<ListingValidationException>().WithMessage("*removidos*");
    }

    [Fact]
    public async Task UpdateAsync_SoldListing_ThrowsValidationException()
    {
        var (svc, db, sellerId) = BuildSut();
        db.Listings.Add(new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "Sold", Description = "desc",
            Price = 100m, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Sold, SoldAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var id = db.Listings.First().Id;

        var act = () => svc.UpdateAsync(sellerId, id, new UpdateListingRequest { Price = 50m });
        await act.Should().ThrowAsync<ListingValidationException>().WithMessage("*vendidos*");
    }

    [Fact]
    public async Task RenewAsync_SimultaneousCalls_BothSucceedAndListingIsActive()
    {
        // Simulate two tabs calling RenewAsync on the same expired listing simultaneously.
        // Both should succeed (load-then-save with EF in-memory — no concurrency exception),
        // and the final state must be active with ExpiresAt ~30 days out.
        var (svc, db, sellerId) = BuildSut();
        db.Listings.Add(new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "Concurrent", Description = "desc",
            Price = 50m, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Expired, ExpiresAt = DateTime.UtcNow.AddDays(-2),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        var id = db.Listings.First().Id;

        // Fire both concurrently (in-memory db serializes, but tests the idempotency of outcome)
        var t1 = svc.RenewAsync(sellerId, id);
        var t2 = svc.RenewAsync(sellerId, id);
        var results = await Task.WhenAll(t1, t2);

        results[0].Status.Should().Be("active");
        results[1].Status.Should().Be("active");
        var final = await db.Listings.FindAsync(id);
        final!.Status.Should().Be(ListingStatus.Active);
        final.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromSeconds(10));
    }

    [Fact]
    public async Task ToggleFavorite_UnfavoritingExpiredListing_AlwaysSucceeds()
    {
        // Unfavoriting must always be permitted regardless of listing status —
        // the check is reordered so existing favorites are removed before status guard.
        var (svc, db, sellerId) = BuildSut();
        var buyerId = Guid.NewGuid();
        db.Users.Add(new User { Id = buyerId, Email = "b@x.com", PasswordHash = "h", DisplayName = "B", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        db.Listings.Add(new Listing
        {
            Id = 999, SellerId = sellerId, BairroId = 1, Title = "Exp", Description = "d",
            Price = 1m, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Expired, ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        db.ListingFavorites.Add(new ListingFavorite { ListingId = 999, UserId = buyerId, SnapshotPrice = 1m, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        // Unfavoriting an expired listing must succeed (returns false = unfavorited)
        var result = await svc.ToggleFavoriteAsync(buyerId, 999);
        result.Should().BeFalse();
        db.ListingFavorites.Should().BeEmpty();
    }
}
