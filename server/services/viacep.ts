interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const cache = new Map<string, { data: ViaCEPResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

export async function buscarCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cleanCep = cep.replace(/\D/g, "");
  
  if (cleanCep.length !== 8) {
    throw new Error("CEP inválido");
  }

  const cached = cache.get(cleanCep);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Erro ao buscar CEP");
    }

    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      return null;
    }

    cache.set(cleanCep, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout ao buscar CEP");
    }
    throw error;
  }
}
