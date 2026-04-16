using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class BairroService : IBairroService
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;

    public BairroService(AppDbContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<Bairro?> MatchBairroAsync(string bairroNome, string cidade, string uf, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(bairroNome) || string.IsNullOrWhiteSpace(cidade) || string.IsNullOrWhiteSpace(uf))
            return null;

        var cacheKey = $"bairros:{uf.ToLowerInvariant()}:{cidade.ToLowerInvariant()}";
        var list = await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return await _db.Bairros
                .AsNoTracking()
                .Where(b => b.IsActive && b.Cidade == cidade && b.Uf == uf)
                .ToListAsync(ct);
        });

        if (list == null) return null;

        var normalized = Normalize(bairroNome);
        return list.FirstOrDefault(b => Normalize(b.Nome) == normalized)
            ?? list.FirstOrDefault(b => Normalize(b.Nome).Contains(normalized) || normalized.Contains(Normalize(b.Nome)));
    }

    private static string Normalize(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var formD = s.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in formD)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC).ToLowerInvariant().Trim();
    }
}
