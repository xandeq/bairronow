using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Auth;

[Trait("Category", "Unit")]
public class GoogleOAuthTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly AuthService _service;

    public GoogleOAuthTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _tokenServiceMock = new Mock<ITokenService>();
        _tokenServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>())).Returns("test-jwt");
        _tokenServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("test-refresh");

        _httpClientFactoryMock = new Mock<IHttpClientFactory>();

        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-key-must-be-at-least-32-characters-long-for-hmac",
            ["Jwt:Issuer"] = "BairroNow",
            ["Jwt:Audience"] = "BairroNow"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();

        _service = new AuthService(
            _db,
            _tokenServiceMock.Object,
            Mock.Of<IEmailService>(),
            config,
            _httpClientFactoryMock.Object,
            Mock.Of<ILogger<AuthService>>());
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GoogleSignInAsync_CreatesNewUser_WhenEmailNotFound()
    {
        var (response, refreshToken, error) = await _service.GoogleSignInAsync("new@gmail.com", "google-123");

        error.Should().BeNull();
        response.Should().NotBeNull();
        var user = await _db.Users.FirstAsync(u => u.Email == "new@gmail.com");
        user.GoogleId.Should().Be("google-123");
        user.EmailConfirmed.Should().BeTrue();
    }

    [Fact]
    public async Task GoogleSignInAsync_LinksGoogleId_ToExistingUser()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "existing@gmail.com", PasswordHash = "hash" });
        await _db.SaveChangesAsync();

        var (response, _, error) = await _service.GoogleSignInAsync("existing@gmail.com", "google-456");

        error.Should().BeNull();
        var user = await _db.Users.FindAsync(userId);
        user!.GoogleId.Should().Be("google-456");
    }

    [Fact]
    public async Task GoogleSignInAsync_ReturnsJwt()
    {
        var (response, refreshToken, error) = await _service.GoogleSignInAsync("jwt@gmail.com", "google-789");

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AccessToken.Should().Be("test-jwt");
        refreshToken.Should().Be("test-refresh");
    }

    [Fact]
    public async Task GoogleSignInMobileAsync_VerifiesIdToken_ReturnsJwt()
    {
        var tokenInfo = JsonSerializer.Serialize(new
        {
            email = "mobile@gmail.com",
            email_verified = "true",
            sub = "google-mobile-123"
        });

        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(tokenInfo)
            });

        var client = new HttpClient(mockHandler.Object);
        _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var (response, refreshToken, error) = await _service.GoogleSignInMobileAsync("valid-id-token");

        error.Should().BeNull();
        response.Should().NotBeNull();
        response!.AccessToken.Should().Be("test-jwt");
    }

    [Fact]
    public async Task GoogleSignInMobileAsync_RejectsInvalidToken()
    {
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.BadRequest));

        var client = new HttpClient(mockHandler.Object);
        _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var (response, _, error) = await _service.GoogleSignInMobileAsync("invalid-token");

        response.Should().BeNull();
        error.Should().NotBeNull();
    }
}
