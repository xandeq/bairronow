using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Auth;

[Trait("Category", "Unit")]
public class MagicLinkTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly AuthService _service;

    public MagicLinkTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _emailServiceMock = new Mock<IEmailService>();

        var tokenServiceMock = new Mock<ITokenService>();
        tokenServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>())).Returns("test-jwt");
        tokenServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("test-refresh");

        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-key-must-be-at-least-32-characters-long-for-hmac",
            ["Jwt:Issuer"] = "BairroNow",
            ["Jwt:Audience"] = "BairroNow",
            ["FrontendUrl"] = "https://bairronow.com.br"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();

        _service = new AuthService(
            _db,
            tokenServiceMock.Object,
            _emailServiceMock.Object,
            config,
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<ILogger<AuthService>>());
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task RequestMagicLinkAsync_CreatesHashedToken()
    {
        _db.Users.Add(new User { Id = Guid.NewGuid(), Email = "user@test.com", PasswordHash = "hash" });
        await _db.SaveChangesAsync();

        await _service.RequestMagicLinkAsync("user@test.com");

        var magicLink = await _db.MagicLinkTokens.FirstOrDefaultAsync();
        magicLink.Should().NotBeNull();
        magicLink!.TokenHash.Should().NotBeNullOrEmpty();
        magicLink.ExpiresAt.Should().BeAfter(DateTime.UtcNow);

        _emailServiceMock.Verify(x => x.SendMagicLinkAsync("user@test.com", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task VerifyMagicLinkAsync_SucceedsWithValidToken()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "user@test.com", PasswordHash = "hash" });

        var rawToken = RandomNumberGenerator.GetBytes(32);
        var tokenHash = Convert.ToBase64String(SHA256.HashData(rawToken));
        _db.MagicLinkTokens.Add(new MagicLinkToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            Used = false
        });
        await _db.SaveChangesAsync();

        var (response, refreshToken, error) = await _service.VerifyMagicLinkAsync(Convert.ToBase64String(rawToken));

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AccessToken.Should().Be("test-jwt");

        // Token should be marked as used
        var storedToken = await _db.MagicLinkTokens.FirstAsync();
        storedToken.Used.Should().BeTrue();
    }

    [Fact]
    public async Task VerifyMagicLinkAsync_FailsWithExpiredToken()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "user@test.com", PasswordHash = "hash" });

        var rawToken = RandomNumberGenerator.GetBytes(32);
        var tokenHash = Convert.ToBase64String(SHA256.HashData(rawToken));
        _db.MagicLinkTokens.Add(new MagicLinkToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1), // Expired
            Used = false
        });
        await _db.SaveChangesAsync();

        var (response, _, error) = await _service.VerifyMagicLinkAsync(Convert.ToBase64String(rawToken));

        response.Should().BeNull();
        error.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyMagicLinkAsync_FailsWithUsedToken()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "user@test.com", PasswordHash = "hash" });

        var rawToken = RandomNumberGenerator.GetBytes(32);
        var tokenHash = Convert.ToBase64String(SHA256.HashData(rawToken));
        _db.MagicLinkTokens.Add(new MagicLinkToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            Used = true // Already used
        });
        await _db.SaveChangesAsync();

        var (response, _, error) = await _service.VerifyMagicLinkAsync(Convert.ToBase64String(rawToken));

        response.Should().BeNull();
        error.Should().NotBeNull();
    }
}
