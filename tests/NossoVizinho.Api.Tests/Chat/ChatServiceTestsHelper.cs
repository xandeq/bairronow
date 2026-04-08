using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Hubs;
using NossoVizinho.Api.Models.Entities;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Tests.Chat;

internal static class ChatTestBuilder
{
    public static (ChatService svc, AppDbContext db, Guid buyer, Guid seller, int listingId) Build()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new AppDbContext(options);

        var sellerId = Guid.NewGuid();
        var buyerId = Guid.NewGuid();
        db.Users.Add(new User { Id = sellerId, Email = "s@x", PasswordHash = "h", DisplayName = "Seller", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        db.Users.Add(new User { Id = buyerId, Email = "b@x", PasswordHash = "h", DisplayName = "Buyer", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        var listing = new Listing
        {
            SellerId = sellerId, BairroId = 1, Title = "Bike", Description = "Bike seminova aro 26",
            Price = 500, CategoryCode = "esportes", SubcategoryCode = "bicicleta",
            Status = "active", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        db.Listings.Add(listing);
        db.SaveChanges();

        var hubMock = new Mock<IHubContext<NotificationHub>>();
        var clientsMock = new Mock<IHubClients>();
        var proxyMock = new Mock<IClientProxy>();
        clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(proxyMock.Object);
        clientsMock.Setup(c => c.User(It.IsAny<string>())).Returns(proxyMock.Object);
        hubMock.SetupGet(h => h.Clients).Returns(clientsMock.Object);

        var files = new Mock<IFileStorageService>();
        var svc = new ChatService(db, files.Object, hubMock.Object, NullLogger<ChatService>.Instance);
        return (svc, db, buyerId, sellerId, listing.Id);
    }
}
