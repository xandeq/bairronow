using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public interface IBairroService
{
    Task<Bairro?> MatchBairroAsync(string bairroNome, string cidade, string uf, CancellationToken ct = default);
}
