using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NossoVizinho.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinBairro(string bairroId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"bairro-{bairroId}");
    }
}
