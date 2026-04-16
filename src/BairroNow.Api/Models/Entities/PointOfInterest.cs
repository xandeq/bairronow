using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

public class PointOfInterest
{
    public int Id { get; set; }
    public int BairroId { get; set; }
    public Bairro? Bairro { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PoiCategory Category { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
