using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;

namespace NossoVizinho.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly AppDbContext _db;

    public NotificationHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task JoinBairro(string bairroId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"bairro-{bairroId}");
    }

    // ─── Phase 4 (D-12): Chat group join/leave on the existing hub.
    // No parallel ChatHub is created.
    public async Task JoinConversation(int conversationId)
    {
        var userId = GetUserId();
        if (userId == null) throw new HubException("Unauthorized");

        var isParticipant = await _db.ConversationParticipants
            .AsNoTracking()
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId.Value && !p.SoftDeleted);

        if (!isParticipant) throw new HubException("Not a participant");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }

    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }

    private Guid? GetUserId()
    {
        var sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? Context.User?.FindFirst("sub")?.Value
                  ?? Context.UserIdentifier;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
