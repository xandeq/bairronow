using FluentAssertions;
using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Tests.Chat;

public class ConversationRepositoryTests
{
    [Fact]
    public async Task CreateOrGet_DedupesExistingConversation()
    {
        var (svc, _, buyer, seller, listingId) = ChatTestBuilder.Build();
        var a = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        var b = await svc.CreateOrGetAsync(buyer, new CreateConversationRequest { ListingId = listingId });
        b.Id.Should().Be(a.Id);
    }
}
