using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Data.Seed;

public static class VilaVelhaBairros
{
    public static IReadOnlyList<Bairro> All => new List<Bairro>
    {
        new() { Nome = "Praia da Costa", Cidade = "Vila Velha", Uf = "ES", Slug = "praia-da-costa", IsActive = true },
        new() { Nome = "Itapuã", Cidade = "Vila Velha", Uf = "ES", Slug = "itapua", IsActive = true },
        new() { Nome = "Coqueiral de Itaparica", Cidade = "Vila Velha", Uf = "ES", Slug = "coqueiral-de-itaparica", IsActive = true },
        new() { Nome = "Itaparica", Cidade = "Vila Velha", Uf = "ES", Slug = "itaparica", IsActive = true },
        new() { Nome = "Centro", Cidade = "Vila Velha", Uf = "ES", Slug = "centro", IsActive = true },
        new() { Nome = "Glória", Cidade = "Vila Velha", Uf = "ES", Slug = "gloria", IsActive = true },
        new() { Nome = "Cobilândia", Cidade = "Vila Velha", Uf = "ES", Slug = "cobilandia", IsActive = true },
        new() { Nome = "Divino Espírito Santo", Cidade = "Vila Velha", Uf = "ES", Slug = "divino-espirito-santo", IsActive = true },
        new() { Nome = "Jockey de Itaparica", Cidade = "Vila Velha", Uf = "ES", Slug = "jockey-de-itaparica", IsActive = true },
        new() { Nome = "Praia das Gaivotas", Cidade = "Vila Velha", Uf = "ES", Slug = "praia-das-gaivotas", IsActive = true },
        new() { Nome = "Aribiri", Cidade = "Vila Velha", Uf = "ES", Slug = "aribiri", IsActive = true },
        new() { Nome = "Soteco", Cidade = "Vila Velha", Uf = "ES", Slug = "soteco", IsActive = true },
    };
}
