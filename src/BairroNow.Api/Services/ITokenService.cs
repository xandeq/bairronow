using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
