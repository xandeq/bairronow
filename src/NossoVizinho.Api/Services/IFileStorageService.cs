namespace NossoVizinho.Api.Services;

public interface IFileStorageService
{
    Task<(string relativePath, string sha256)> SaveProofAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);
    Stream? OpenProof(string relativePath);
}
