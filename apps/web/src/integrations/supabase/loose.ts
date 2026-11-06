import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Cliente Supabase sem o schema gerado.
 *
 * A camada de serviços (`src/services/*`) é genérica: o nome da tabela chega
 * pelo construtor e as colunas são montadas em tempo de execução. O cliente
 * tipado (`supabase`) não consegue validar esse uso — ele infere todas as
 * tabelas do schema em cada chamada e estoura com TS2769/TS2589.
 *
 * Aqui a checagem de tipo continua acontecendo nas interfaces de cada serviço
 * (`Product`, `Order`, ...). Use este cliente **somente** em código cuja
 * tabela é dinâmica; nos demais casos prefira o cliente tipado.
 */
export const supabaseLoose = supabase as unknown as SupabaseClient;