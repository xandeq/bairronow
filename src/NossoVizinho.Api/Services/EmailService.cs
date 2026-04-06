namespace NossoVizinho.Api.Services;

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
}
