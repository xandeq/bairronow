using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;
using BairroNow.Api.Validators;

namespace BairroNow.Api.Tests.Ratings;

public class RatingServiceTests
{
    private static (RatingService svc, AppDbContext db, Guid seller, Guid buyer, int listingId) Build()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new AppDbContext(options);
        var sellerId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        db.Users.Add(new User { Id = sellerId, Email = "s@x", PasswordHash = "h", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = buyerId, Email = "b@x", PasswordHash = "h", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        var listing = new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "X", Description = "desc 12345",
            Price = 100, CategoryCode = "outros", SubcategoryCode = "diversos",
            Status = ListingStatus.Sold, SoldAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Listings.Add(listing);
        db.SaveChanges();
        return (new RatingService(db, new CreateRatingRequestValidator()), db, sellerId, buyerId, listing.Id);
    }

    [Fact]
    public async Task Create_Stars1to5()
    {
        var (svc, _, seller, buyer, listingId) = Build();
        var dto = new CreateRatingRequest { Stars = 5, Comment = "ótimo", ListingId = listingId };
        var rating = await svc.CreateAsync(buyer, seller, dto);
        rating.Stars.Should().Be(5);
    }

    [Fact]
    public async Task Edit_Within7Days_Succeeds()
    {
        var (svc, _, seller, buyer, listingId) = Build();
        var rating = await svc.CreateAsync(buyer, seller, new CreateRatingRequest { Stars = 4, ListingId = listingId });
        var updated = await svc.EditAsync(buyer, seller, rating.Id, new CreateRatingRequest { Stars = 3, ListingId = listingId });
        updated.Stars.Should().Be(3);
    }

    [Fact]
    public async Task Edit_After7Days_Rejected()
    {
        var (svc, db, seller, buyer, listingId) = Build();
        var rating = await svc.CreateAsync(buyer, seller, new CreateRatingRequest { Stars = 4, ListingId = listingId });
        var entity = await db.SellerRatings.FirstAsync(r => r.Id == rating.Id);
        entity.CreatedAt = DateTime.UtcNow.AddDays(-8);
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<RatingForbiddenException>(() => svc.EditAsync(buyer, seller, rating.Id, new CreateRatingRequest { Stars = 5, ListingId = listingId }));
    }
}
