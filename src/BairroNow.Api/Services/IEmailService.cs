namespace BairroNow.Api.Services;

public interface IEmailService
{
    Task SendConfirmationEmailAsync(string email, string token);
    Task SendPasswordResetEmailAsync(string email, string token);
    Task SendMagicLinkAsync(string email, string magicUrl);
    Task SendVerificationStatusAsync(string email, string status, string? reason);
    Task SendWeeklyDigestAsync(string email, string bairroName, string htmlBody);
    Task SendAccountDeletionConfirmationAsync(string email);
}
