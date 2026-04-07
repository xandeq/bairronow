using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public interface IBairroService
{
    Task<Bairro?> MatchBairroAsync(string bairroNome, string cidade, string uf, CancellationToken ct = default);
}
