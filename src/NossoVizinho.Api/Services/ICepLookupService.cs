namespace NossoVizinho.Api.Services;

public class CepLookupResult
{
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string Bairro { get; set; } = string.Empty;
    public string Localidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public int? BairroId { get; set; }
    public string? BairroNome { get; set; }
}

public class CepNotFoundException : Exception
{
    public CepNotFoundException(string cep) : base($"CEP {cep} não encontrado.") { }
}

public interface ICepLookupService
{
    Task<CepLookupResult> LookupAsync(string cep, CancellationToken ct = default);
}
