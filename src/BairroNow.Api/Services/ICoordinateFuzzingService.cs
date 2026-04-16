namespace BairroNow.Api.Services;

public interface ICoordinateFuzzingService
{
    (double Lat, double Lng) FuzzCoordinates(double lat, double lng, Guid userId);
    (double? Lat, double? Lng) FuzzCoordinatesNullable(double? lat, double? lng, Guid userId);
}
