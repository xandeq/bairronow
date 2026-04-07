import type { CepAddress } from "@/types/onboarding";

const sanitize = (cep: string) => cep.replace(/\D/g, "");

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface BrasilApiResponse {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  location?: {
    coordinates?: { latitude?: string; longitude?: string };
  };
}

async function fetchViaCep(cep: string): Promise<CepAddress | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return null;
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;
    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    };
  } catch {
    return null;
  }
}

async function fetchBrasilApi(cep: string): Promise<CepAddress | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!res.ok) return null;
    const data: BrasilApiResponse = await res.json();
    const lat = data.location?.coordinates?.latitude;
    const lng = data.location?.coordinates?.longitude;
    return {
      cep: data.cep,
      logradouro: data.street,
      bairro: data.neighborhood,
      localidade: data.city,
      uf: data.state,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
    };
  } catch {
    return null;
  }
}

export async function lookupCep(cepRaw: string): Promise<CepAddress> {
  const cep = sanitize(cepRaw);
  if (cep.length !== 8) {
    throw new Error("CEP deve conter 8 dígitos");
  }
  const viaCep = await fetchViaCep(cep);
  if (viaCep) return viaCep;
  const brasilApi = await fetchBrasilApi(cep);
  if (brasilApi) return brasilApi;
  throw new Error("CEP não encontrado");
}

export function formatCep(value: string): string {
  const digits = sanitize(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
