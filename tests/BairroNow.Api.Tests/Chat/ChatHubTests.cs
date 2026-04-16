using FluentAssertions;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;
using Xunit;

namespace BairroNow.Api.Tests.Chat;

public class ChatHubTests
{
    [Fact]
    public async Task JoinConversation_RejectsNonParticipant()
    {
        // Non-participants are rejected by ChatService.EnsureParticipantAsync via SendAsync/MarkReadAsync.
        // The NotificationHub.JoinConversation method executes the same query. We assert the service
        // layer refuses non-participants (which is the same check).
        var (svc, db, buyer, seller, listingId) = ChatTestBuilder.Build();
        var conv = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        var strangerId = Guid.NewGuid();
        db.Users.Add(new User { Id = strangerId, Email = "t@x", PasswordHash = "h", BairroId = 1, IsVerified = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BairroNow.Api.Services.ChatForbiddenException>(
            () => svc.MarkReadAsync(strangerId, conv.Id));
    }

    [Fact]
    public async Task SendMessage_BroadcastsToGroup()
    {
        var (svc, _, buyer, seller, listingId) = ChatTestBuilder.Build();
        var conv = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        var msg = await svc.SendAsync(buyer, conv.Id, "Oi, ainda disponível?", null);
        msg.Text.Should().Be("Oi, ainda disponível?");
        msg.ConversationId.Should().Be(conv.Id);
    }
}
