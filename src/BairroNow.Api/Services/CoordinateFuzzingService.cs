namespace BairroNow.Api.Services;

public class CoordinateFuzzingService : ICoordinateFuzzingService
{
    // ±0.001° ≈ ±110m at Brazilian latitudes — hides exact address, keeps pin in bairro
    private const double Offset = 0.001;

    public (double Lat, double Lng) FuzzCoordinates(double lat, double lng, Guid userId)
    {
        var seed = userId.GetHashCode();
        var rng = new Random(seed);
        var latOffset = (rng.NextDouble() * Offset * 2) - Offset;
        var lngOffset = (rng.NextDouble() * Offset * 2) - Offset;
        return (lat + latOffset, lng + lngOffset);
    }

    public (double? Lat, double? Lng) FuzzCoordinatesNullable(double? lat, double? lng, Guid userId)
    {
        if (lat is null || lng is null) return (null, null);
        var (fLat, fLng) = FuzzCoordinates(lat.Value, lng.Value, userId);
        return (fLat, fLng);
    }
}
