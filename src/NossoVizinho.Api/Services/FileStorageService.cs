using System.Security.Cryptography;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace NossoVizinho.Api.Services;

// Uses SixLabors.ImageSharp to resize/compress images. Stores under wwwroot/uploads/proofs.
public class FileStorageService : IFileStorageService
{
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "application/pdf"
    };

    private readonly IWebHostEnvironment _env;

    public FileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<(string relativePath, string sha256)> SaveProofAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        if (!AllowedTypes.Contains(contentType))
            throw new InvalidOperationException($"Tipo de arquivo não permitido: {contentType}");

        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, ct);
        if (ms.Length == 0)
            throw new InvalidOperationException("Arquivo vazio.");
        if (ms.Length > MaxBytes)
            throw new InvalidOperationException("Arquivo excede 5MB.");

        ms.Position = 0;

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");

        var now = DateTime.UtcNow;
        var relDir = Path.Combine("uploads", "proofs", now.ToString("yyyy"), now.ToString("MM")).Replace("\\", "/");
        var absDir = Path.Combine(webRoot, relDir);
        Directory.CreateDirectory(absDir);

        string ext;
        byte[] outBytes;

        if (contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            ext = ".pdf";
            outBytes = ms.ToArray();
        }
        else
        {
            ext = ".jpg";
            using var image = await Image.LoadAsync(ms, ct);
            const int maxSide = 1600;
            if (image.Width > maxSide || image.Height > maxSide)
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(maxSide, maxSide)
                }));
            }
            using var outMs = new MemoryStream();
            await image.SaveAsJpegAsync(outMs, new JpegEncoder { Quality = 85 }, ct);
            outBytes = outMs.ToArray();
        }

        var guid = Guid.NewGuid().ToString("N");
        var fileRel = $"{relDir}/{guid}{ext}";
        var fileAbs = Path.Combine(webRoot, relDir, guid + ext);
        await File.WriteAllBytesAsync(fileAbs, outBytes, ct);

        var sha = Convert.ToHexString(SHA256.HashData(outBytes)).ToLowerInvariant();
        return (fileRel, sha);
    }

    public Stream? OpenProof(string relativePath)
    {
        var webRoot = _env.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        var abs = Path.Combine(webRoot, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!File.Exists(abs)) return null;
        return File.OpenRead(abs);
    }
}
