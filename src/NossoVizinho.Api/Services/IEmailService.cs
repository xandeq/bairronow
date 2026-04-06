namespace NossoVizinho.Api.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string email, string token);
    Task SendPasswordResetEmailAsync(string email, string token);
}
