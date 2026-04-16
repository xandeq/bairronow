namespace BairroNow.Api.Constants;

// Phase 4 D-24, D-25: Hardcoded 10-category taxonomy with 2-3 subcategories per category.
// Admin can ON/OFF categories via toggles (D-26) -- Enabled flag is loaded/persisted by
// CategoriesController via an in-memory dictionary backed by IMemoryCache (no DB table in MVP).
public static class Categories
{
    public sealed record Subcategory(string Code, string DisplayName);
    public sealed record Category(string Code, string DisplayName, IReadOnlyList<Subcategory> Subcategories);

    public static readonly IReadOnlyList<Category> All = new List<Category>
    {
        new("eletronicos",  "Eletrônicos & Informática", new List<Subcategory>
        {
            new("celular",  "Celular"),
            new("notebook", "Notebook"),
            new("tv",       "TV"),
            new("outros",   "Outros"),
        }),
        new("moveis", "Móveis & Decoração", new List<Subcategory>
        {
            new("sala",    "Sala"),
            new("quarto",  "Quarto"),
            new("cozinha", "Cozinha"),
        }),
        new("roupas", "Roupas, Calçados & Acessórios", new List<Subcategory>
        {
            new("masculino",  "Masculino"),
            new("feminino",   "Feminino"),
            new("infantil",   "Infantil"),
        }),
        new("veiculos", "Veículos & Peças", new List<Subcategory>
        {
            new("carro",  "Carro"),
            new("moto",   "Moto"),
            new("pecas",  "Peças"),
        }),
        new("casa-jardim", "Casa & Jardim", new List<Subcategory>
        {
            new("ferramentas",   "Ferramentas"),
            new("jardinagem",    "Jardinagem"),
            new("eletrodomestico","Eletrodoméstico"),
        }),
        new("esportes", "Esportes & Lazer", new List<Subcategory>
        {
            new("bicicleta", "Bicicleta"),
            new("academia",  "Academia"),
            new("camping",   "Camping"),
        }),
        new("infantil", "Infantil & Bebê", new List<Subcategory>
        {
            new("brinquedo", "Brinquedo"),
            new("carrinho",  "Carrinho/Berço"),
            new("roupa",     "Roupa"),
        }),
        new("livros", "Livros & Revistas", new List<Subcategory>
        {
            new("ficcao",   "Ficção"),
            new("didatico", "Didático"),
            new("outros",   "Outros"),
        }),
        new("servicos", "Serviços", new List<Subcategory>
        {
            new("reforma",  "Reforma"),
            new("limpeza",  "Limpeza"),
            new("aulas",    "Aulas"),
        }),
        new("outros", "Outros", new List<Subcategory>
        {
            new("diversos", "Diversos"),
        }),
    };

    public static readonly string[] CATEGORY_CODES = All.Select(c => c.Code).ToArray();

    public static bool IsValidCategoryCode(string code) =>
        !string.IsNullOrWhiteSpace(code) && CATEGORY_CODES.Contains(code);

    public static bool IsValidSubcategoryCode(string categoryCode, string subCode)
    {
        var cat = All.FirstOrDefault(c => c.Code == categoryCode);
        return cat != null && cat.Subcategories.Any(s => s.Code == subCode);
    }
}
