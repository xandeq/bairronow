namespace BairroNow.Api.Services;

public class OcrService
{
    private readonly ILogger<OcrService> _logger;

    public OcrService(ILogger<OcrService> logger)
    {
        _logger = logger;
    }

    public Task<string?> ExtractTextAsync(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("OCR: file not found {Path}", filePath);
                return Task.FromResult<string?>(null);
            }

            // TesseractOCR requires native binaries (leptonica + tesseract).
            // On SmarterASP shared hosting these are unlikely to be available.
            // Graceful degradation: attempt to load, return null on failure.
            using var engine = new TesseractOCR.Engine(@"./tessdata", TesseractOCR.Enums.Language.English);
            using var img = TesseractOCR.Pix.Image.LoadFromFile(filePath);
            using var page = engine.Process(img);

            var text = page.Text;
            if (string.IsNullOrWhiteSpace(text))
                return Task.FromResult<string?>(null);

            return Task.FromResult<string?>(text.Trim());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OCR extraction failed for {Path} — Tesseract native binaries may not be available", filePath);
            return Task.FromResult<string?>(null);
        }
    }
}
