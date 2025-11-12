interface IBGEEstado {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGEMunicipio {
  id: number;
  nome: string;
}

const estadosCache: { data: IBGEEstado[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

const municipiosCache = new Map<string, { data: IBGEMunicipio[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

export async function buscarEstados(): Promise<IBGEEstado[]> {
  if (estadosCache.data && Date.now() - estadosCache.timestamp < CACHE_TTL) {
    return estadosCache.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Erro ao buscar estados");
    }

    const data: IBGEEstado[] = await response.json();
    estadosCache.data = data;
    estadosCache.timestamp = Date.now();

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout ao buscar estados");
    }
    throw error;
  }
}

export async function buscarMunicipios(uf: string): Promise<IBGEMunicipio[]> {
  const ufUpper = uf.toUpperCase();

  const cached = municipiosCache.get(ufUpper);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufUpper}/municipios?orderBy=nome`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Erro ao buscar municípios");
    }

    const data: IBGEMunicipio[] = await response.json();
    municipiosCache.set(ufUpper, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout ao buscar municípios");
    }
    throw error;
  }
}
