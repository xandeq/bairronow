using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
