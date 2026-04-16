using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Tests.Chat;

public class UnreadCountTests
{
    [Fact]
    public async Task Count_IgnoresSoftDeletedMessages()
    {
        var (svc, db, buyer, seller, listingId) = ChatTestBuilder.Build();
        var conv = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        await svc.SendAsync(buyer, conv.Id, "m1", null);
        var m2 = await svc.SendAsync(buyer, conv.Id, "m2", null);
        // Soft-delete m2
        var entity = await db.Messages.FirstAsync(m => m.Id == m2.Id);
        entity.DeletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var unread = await svc.GetUnreadCountAsync(seller);
        unread.Should().Be(1); // only m1 is counted
    }

    [Fact]
    public async Task Count_HonorsLastReadAt()
    {
        var (svc, _, buyer, seller, listingId) = ChatTestBuilder.Build();
        var conv = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        await svc.SendAsync(buyer, conv.Id, "msg", null);
        (await svc.GetUnreadCountAsync(seller)).Should().Be(1);
        await svc.MarkReadAsync(seller, conv.Id);
        (await svc.GetUnreadCountAsync(seller)).Should().Be(0);
    }
}
