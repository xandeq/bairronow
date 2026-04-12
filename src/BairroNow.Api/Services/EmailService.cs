namespace BairroNow.Api.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendConfirmationEmailAsync(string email, string token)
    {
        _logger.LogInformation("STUB: Confirmation email to {Email} with token {Token}", email, token);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetEmailAsync(string email, string token)
    {
        _logger.LogInformation("STUB: Password reset email to {Email} with token {Token}", email, token);
        return Task.CompletedTask;
    }

    public Task SendMagicLinkAsync(string email, string magicUrl)
    {
        _logger.LogInformation("STUB: Magic link email to {Email} with URL {Url}", email, magicUrl);
        return Task.CompletedTask;
    }

    public Task SendVerificationStatusAsync(string email, string status, string? reason)
    {
        _logger.LogInformation("STUB: Verification status email to {Email}: {Status}", email, status);
        return Task.CompletedTask;
    }

    public Task SendWeeklyDigestAsync(string email, string bairroName, string htmlBody)
    {
        _logger.LogInformation("STUB: Weekly digest email to {Email} for {Bairro}", email, bairroName);
        return Task.CompletedTask;
    }

    public Task SendAccountDeletionConfirmationAsync(string email)
    {
        _logger.LogInformation("STUB: Account deletion confirmation email to {Email}", email);
        return Task.CompletedTask;
    }
}
