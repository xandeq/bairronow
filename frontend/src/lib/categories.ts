// Phase 4 D-24/D-25: Hardcoded 10-category taxonomy mirroring
// src/NossoVizinho.Api/Constants/Categories.cs. Kept in sync manually.
// Cache from GET /api/v1/categories after first fetch to pick up admin toggles.

export interface LocalSubcategory {
  code: string;
  displayName: string;
}

export interface LocalCategory {
  code: string;
  displayName: string;
  subcategories: LocalSubcategory[];
}

export const CATEGORIES: LocalCategory[] = [
  {
    code: "eletronicos",
    displayName: "Eletrônicos & Informática",
    subcategories: [
      { code: "celular", displayName: "Celular" },
      { code: "notebook", displayName: "Notebook" },
      { code: "tv", displayName: "TV" },
      { code: "outros", displayName: "Outros" },
    ],
  },
  {
    code: "moveis",
    displayName: "Móveis & Decoração",
    subcategories: [
      { code: "sala", displayName: "Sala" },
      { code: "quarto", displayName: "Quarto" },
      { code: "cozinha", displayName: "Cozinha" },
    ],
  },
  {
    code: "roupas",
    displayName: "Roupas, Calçados & Acessórios",
    subcategories: [
      { code: "masculino", displayName: "Masculino" },
      { code: "feminino", displayName: "Feminino" },
      { code: "infantil", displayName: "Infantil" },
    ],
  },
  {
    code: "veiculos",
    displayName: "Veículos & Peças",
    subcategories: [
      { code: "carro", displayName: "Carro" },
      { code: "moto", displayName: "Moto" },
      { code: "pecas", displayName: "Peças" },
    ],
  },
  {
    code: "casa-jardim",
    displayName: "Casa & Jardim",
    subcategories: [
      { code: "ferramentas", displayName: "Ferramentas" },
      { code: "jardinagem", displayName: "Jardinagem" },
      { code: "eletrodomestico", displayName: "Eletrodoméstico" },
    ],
  },
  {
    code: "esportes",
    displayName: "Esportes & Lazer",
    subcategories: [
      { code: "bicicleta", displayName: "Bicicleta" },
      { code: "academia", displayName: "Academia" },
      { code: "camping", displayName: "Camping" },
    ],
  },
  {
    code: "infantil",
    displayName: "Infantil & Bebê",
    subcategories: [
      { code: "brinquedo", displayName: "Brinquedo" },
      { code: "carrinho", displayName: "Carrinho/Berço" },
      { code: "roupa", displayName: "Roupa" },
    ],
  },
  {
    code: "livros",
    displayName: "Livros & Revistas",
    subcategories: [
      { code: "ficcao", displayName: "Ficção" },
      { code: "didatico", displayName: "Didático" },
      { code: "outros", displayName: "Outros" },
    ],
  },
  {
    code: "servicos",
    displayName: "Serviços",
    subcategories: [
      { code: "reforma", displayName: "Reforma" },
      { code: "limpeza", displayName: "Limpeza" },
      { code: "aulas", displayName: "Aulas" },
    ],
  },
  {
    code: "outros",
    displayName: "Outros",
    subcategories: [{ code: "diversos", displayName: "Diversos" }],
  },
];

export const CATEGORY_CODES = CATEGORIES.map((c) => c.code);

export function findCategory(code: string): LocalCategory | undefined {
  return CATEGORIES.find((c) => c.code === code);
}

export function findSubcategories(categoryCode: string): LocalSubcategory[] {
  return findCategory(categoryCode)?.subcategories ?? [];
}
