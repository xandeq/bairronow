using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using BairroNow.Api.Services;

namespace BairroNow.Api.Tests.Verification;

[Trait("Category", "Unit")]
public class OcrServiceTests
{
    private readonly OcrService _service;

    public OcrServiceTests()
    {
        _service = new OcrService(Mock.Of<ILogger<OcrService>>());
    }

    [Fact]
    public async Task ExtractTextAsync_GracefulFailure_WhenTesseractNotAvailable()
    {
        // On test environments, Tesseract native binaries are not installed.
        // The service should gracefully return null instead of throwing.
        var tempFile = Path.GetTempFileName();
        try
        {
            await File.WriteAllTextAsync(tempFile, "test content");

            var result = await _service.ExtractTextAsync(tempFile);

            // Tesseract will fail to load native binaries on test machines
            // Service should return null gracefully (not throw)
            result.Should().BeNull();
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    [Fact]
    public async Task ExtractTextAsync_FileNotFound_ReturnsNull()
    {
        var result = await _service.ExtractTextAsync("/nonexistent/path/file.jpg");

        result.Should().BeNull();
    }
}
