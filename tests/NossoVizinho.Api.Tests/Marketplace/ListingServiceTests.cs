using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Models.Entities;
using NossoVizinho.Api.Services;
using NossoVizinho.Api.Validators;

namespace NossoVizinho.Api.Tests.Marketplace;

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

        var svc = new ListingService(
            db, fileMock.Object,
            new CreateListingRequestValidator(),
            new UpdateListingRequestValidator(),
            notif.Object,
            new MemoryCache(new MemoryCacheOptions()),
            NullLogger<ListingService>.Instance);
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
}
