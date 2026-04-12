using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;
using OtpNet;

namespace BairroNow.Api.Tests.Auth;

[Trait("Category", "Unit")]
public class TotpServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AuthService _service;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly IConfiguration _configuration;

    public TotpServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _tokenServiceMock = new Mock<ITokenService>();
        _tokenServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>())).Returns("test-jwt");
        _tokenServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("test-refresh");

        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-key-must-be-at-least-32-characters-long-for-hmac",
            ["Jwt:Issuer"] = "BairroNow",
            ["Jwt:Audience"] = "BairroNow"
        };
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(configData).Build();

        _service = new AuthService(
            _db,
            _tokenServiceMock.Object,
            Mock.Of<IEmailService>(),
            _configuration,
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<ILogger<AuthService>>());
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task SetupTotpAsync_ReturnsValidBase32Secret_And8BackupCodes()
    {
        var userId = Guid.NewGuid();
        _db.Users.Add(new User { Id = userId, Email = "admin@test.com", PasswordHash = "hash", IsAdmin = true });
        await _db.SaveChangesAsync();

        var result = await _service.SetupTotpAsync(userId);

        result.Should().NotBeNull();
        result!.Value.Secret.Should().NotBeNullOrEmpty();
        result.Value.BackupCodes.Should().HaveCount(8);

        // Verify secret is valid base32
        var bytes = Base32Encoding.ToBytes(result.Value.Secret);
        bytes.Should().NotBeEmpty();

        // Verify user was updated
        var user = await _db.Users.FindAsync(userId);
        user!.TotpEnabled.Should().BeTrue();
        user.TotpSecret.Should().Be(result.Value.Secret);
    }

    [Fact]
    public async Task VerifyTotpAsync_AcceptsValidTotpCode()
    {
        var userId = Guid.NewGuid();
        var key = KeyGeneration.GenerateRandomKey(20);
        var base32Secret = Base32Encoding.ToString(key);

        _db.Users.Add(new User
        {
            Id = userId,
            Email = "admin@test.com",
            PasswordHash = "hash",
            IsAdmin = true,
            TotpEnabled = true,
            TotpSecret = base32Secret
        });
        await _db.SaveChangesAsync();

        // Generate a valid TOTP code
        var totp = new Totp(key);
        var validCode = totp.ComputeTotp();

        // Generate a temp token with totp_pending claim
        var tempToken = GenerateTempToken(userId);

        var (response, refreshToken, error) = await _service.VerifyTotpAsync(tempToken, validCode);

        error.Should().BeNull();
        response.Should().NotBeNull();
        refreshToken.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyTotpAsync_RejectsInvalidCode()
    {
        var userId = Guid.NewGuid();
        var key = KeyGeneration.GenerateRandomKey(20);
        var base32Secret = Base32Encoding.ToString(key);

        _db.Users.Add(new User
        {
            Id = userId,
            Email = "admin@test.com",
            PasswordHash = "hash",
            IsAdmin = true,
            TotpEnabled = true,
            TotpSecret = base32Secret
        });
        await _db.SaveChangesAsync();

        var tempToken = GenerateTempToken(userId);

        var (response, _, error) = await _service.VerifyTotpAsync(tempToken, "000000");

        response.Should().BeNull();
        error.Should().NotBeNull();
    }

    [Fact]
    public async Task VerifyTotpAsync_BackupCodeRedemption_RemovesUsedCode()
    {
        var userId = Guid.NewGuid();
        var key = KeyGeneration.GenerateRandomKey(20);
        var base32Secret = Base32Encoding.ToString(key);
        var backupCode = "TESTCODE";
        var codeHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(backupCode)));
        var hashedCodes = new[] { codeHash, "other-hash-1", "other-hash-2" };

        _db.Users.Add(new User
        {
            Id = userId,
            Email = "admin@test.com",
            PasswordHash = "hash",
            IsAdmin = true,
            TotpEnabled = true,
            TotpSecret = base32Secret,
            TotpBackupCodes = JsonSerializer.Serialize(hashedCodes)
        });
        await _db.SaveChangesAsync();

        var tempToken = GenerateTempToken(userId);

        var (response, _, error) = await _service.VerifyTotpAsync(tempToken, backupCode);

        error.Should().BeNull();
        response.Should().NotBeNull();

        // Verify backup code was removed
        var user = await _db.Users.FindAsync(userId);
        var remainingCodes = JsonSerializer.Deserialize<string[]>(user!.TotpBackupCodes!);
        remainingCodes.Should().HaveCount(2);
        remainingCodes.Should().NotContain(codeHash);
    }

    private string GenerateTempToken(Guid userId)
    {
        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var claims = new[]
        {
            new System.Security.Claims.Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub, userId.ToString()),
            new System.Security.Claims.Claim("totp_pending", "true"),
            new System.Security.Claims.Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
        {
            Subject = new System.Security.Claims.ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(5),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }
}
