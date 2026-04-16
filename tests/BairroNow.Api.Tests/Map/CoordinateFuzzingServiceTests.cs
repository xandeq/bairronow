using BairroNow.Api.Services;
using FluentAssertions;
using Xunit;

namespace BairroNow.Api.Tests.Map;

[Trait("Category", "Unit")]
public class CoordinateFuzzingServiceTests
{
    private readonly CoordinateFuzzingService _svc = new();

    [Fact]
    public void FuzzCoordinates_ReturnsOffsetWithinOneMeterRange()
    {
        var userId = Guid.NewGuid();
        var (lat, lng) = _svc.FuzzCoordinates(-20.3155, -40.3128, userId);
        lat.Should().BeInRange(-20.3165, -20.3145);
        lng.Should().BeInRange(-40.3138, -40.3118);
    }

    [Fact]
    public void FuzzCoordinates_IsDeterministicForSameUser()
    {
        var userId = Guid.NewGuid();
        var (lat1, lng1) = _svc.FuzzCoordinates(-20.3155, -40.3128, userId);
        var (lat2, lng2) = _svc.FuzzCoordinates(-20.3155, -40.3128, userId);
        lat1.Should().Be(lat2);
        lng1.Should().Be(lng2);
    }

    [Fact]
    public void FuzzCoordinates_DifferentUsersGetDifferentOffsets()
    {
        var (lat1, _) = _svc.FuzzCoordinates(-20.3155, -40.3128, Guid.NewGuid());
        var (lat2, _) = _svc.FuzzCoordinates(-20.3155, -40.3128, Guid.NewGuid());
        lat1.Should().NotBe(lat2);
    }

    [Fact]
    public void FuzzCoordinates_NullInputReturnsNull()
    {
        var (lat, lng) = _svc.FuzzCoordinatesNullable(null, null, Guid.NewGuid());
        lat.Should().BeNull();
        lng.Should().BeNull();
    }
}
