export interface CepLookupResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

const normalizeCepData = (data: Record<string, any>): CepLookupResult => ({
  street: data.logradouro || data.street || '',
  neighborhood: data.bairro || data.neighborhood || '',
  city: data.localidade || data.city || '',
  state: data.uf || data.state || '',
});

export const cepService = {
  async lookup(rawCep: string): Promise<CepLookupResult> {
    const cep = rawCep.replace(/\D/g, '');

    if (cep.length !== 8) {
      throw new Error('CEP inválido');
    }

    try {
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!viaCepResponse.ok) {
        throw new Error('ViaCEP indisponível');
      }

      const viaCepData = await viaCepResponse.json();
      if (!viaCepData.erro) {
        return normalizeCepData(viaCepData);
      }
    } catch (error) {
      console.warn('ViaCEP lookup failed, trying BrasilAPI.', error);
    }

    const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
    if (!brasilApiResponse.ok) {
      throw new Error('CEP não encontrado');
    }

    const brasilApiData = await brasilApiResponse.json();
    return normalizeCepData(brasilApiData);
  }
};
