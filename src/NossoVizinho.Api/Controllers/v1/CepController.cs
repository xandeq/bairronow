using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Controllers.v1;

[ApiController]
public class CepController : ControllerBase
{
    private readonly ICepLookupService _cep;

    public CepController(ICepLookupService cep)
    {
        _cep = cep;
    }

    [HttpGet("/api/v1/cep/{cep}")]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> Lookup(string cep, CancellationToken ct)
    {
        try
        {
            var result = await _cep.LookupAsync(cep, ct);
            return Ok(result);
        }
        catch (CepNotFoundException)
        {
            return NotFound(new { error = "CEP não encontrado." });
        }
    }
}
