namespace BairroNow.Api.Models.Entities;

public class Bairro
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Uf { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public double? CentroidLat { get; set; }
    public double? CentroidLng { get; set; }
}
