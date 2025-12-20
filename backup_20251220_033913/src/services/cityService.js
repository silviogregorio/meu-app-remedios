// import axios from 'axios'; // Removed to reduce dependencies


const BASE_URL = 'https://brasilapi.com.br/api/ibge/municipios/v1';

// Cache simples em memória para evitar requisições repetidas na mesma sessão
const cache = {};

/**
 * Normaliza uma string para comparação:
 * - Remove acentos
 * - Converte para minúsculas
 * - Remove espaços extras (trim)
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .trim();
};

/**
 * Busca cidades de um estado (UF)
 * @param {string} uf - Sigla do estado (ex: 'SP', 'RJ')
 * @returns {Promise<Array>} Lista de cidades { nome, codigo_ibge }
 */
export const fetchCitiesByState = async (uf) => {
    if (!uf) return [];

    const upperUF = uf.toUpperCase();

    // Retorna do cache se existir
    if (cache[upperUF]) {
        return cache[upperUF];
    }

    try {
        const response = await fetch(`${BASE_URL}/${upperUF}?providers=gov`);
        if (!response.ok) throw new Error('Falha na requisição');

        const data = await response.json();

        // Mapeia para formato padrão e ordena
        const cities = data.map(city => ({
            name: city.nome,
            ibge_code: city.codigo_ibge,
            // Pre-normalized version for fast searching
            _normalized: normalizeText(city.nome)
        })).sort((a, b) => a.name.localeCompare(b.name));

        cache[upperUF] = cities;
        return cities;
    } catch (error) {
        console.error(`Erro ao buscar cidades de ${upperUF}:`, error);
        throw error;
    }
};

/**
 * Filtra cidades baseada num termo de busca (ignorando acentos e case)
 * @param {Array} cities - Lista de cidades retornada por fetchCitiesByState
 * @param {string} rawTerm - Termo digitado pelo usuário
 */
export const filterCities = (cities, rawTerm) => {
    if (!rawTerm || !cities) return cities || [];

    const term = normalizeText(rawTerm);

    return cities.filter(city =>
        city._normalized.includes(term)
    );
};
