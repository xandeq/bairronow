using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Services;

public class TokenServiceTests
{
    private readonly TokenService _service;

    public TokenServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "SuperSecretKeyForTestingPurposesOnly1234567890!",
                ["Jwt:Issuer"] = "BairroNow.Test",
                ["Jwt:Audience"] = "BairroNow.Test",
                ["Jwt:AccessTokenExpirationMinutes"] = "15"
            })
            .Build();
        _service = new TokenService(config);
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwt_WithCorrectClaims()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            PasswordHash = "hash",
            DisplayName = "Test User"
        };

        var token = _service.GenerateAccessToken(user);

        Assert.NotEmpty(token);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        Assert.Equal(user.Id.ToString(), jwt.Subject);
        Assert.Equal(user.Email, jwt.Claims.First(c => c.Type == "email").Value);
        Assert.True(jwt.ValidTo > DateTime.UtcNow);
        Assert.True(jwt.ValidTo <= DateTime.UtcNow.AddMinutes(16));
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsBase64String_OfSufficientLength()
    {
        var token = _service.GenerateRefreshToken();

        Assert.NotEmpty(token);
        var bytes = Convert.FromBase64String(token);
        Assert.Equal(64, bytes.Length);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsUniqueTokens()
    {
        var token1 = _service.GenerateRefreshToken();
        var token2 = _service.GenerateRefreshToken();
        Assert.NotEqual(token1, token2);
    }
}
