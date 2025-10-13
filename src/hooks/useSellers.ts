import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Seller {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  specialties: string[];
  responseTime: string;
  joinedAt: string;
  productCount?: number;
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  policies?: {
    returns?: string;
    shipping?: string;
    customization?: string;
  };
}

export interface SellerFilters {
  location?: string;
  specialty?: string;
  verified?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'name' | 'joinedAt' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

export interface UseSellersReturn {
  sellers: Seller[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  filters: SellerFilters;
  setFilters: (filters: SellerFilters) => void;
}

export interface UseSellerReturn {
  seller: Seller | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ITEMS_PER_PAGE = 12;

// Mock data for development
const mockSellers: Seller[] = [
  {
    id: '1',
    name: 'Artesanatos da Maria',
    description: 'Especializada em peças artesanais únicas, feitas à mão com muito carinho. Trabalho com diversos materiais como madeira, tecido e cerâmica.',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20artisan%20portrait%20smiling%20warm%20lighting&image_size=square',
    coverImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=artisan%20workshop%20handmade%20crafts%20colorful%20materials&image_size=landscape_16_9',
    rating: 4.8,
    reviewCount: 127,
    location: 'São Paulo, SP',
    verified: true,
    specialties: ['Artesanato', 'Decoração', 'Presentes Personalizados'],
    responseTime: '2h',
    joinedAt: '2023-01-15',
    productCount: 45,
    email: 'maria@artesanatos.com',
    phone: '(11) 99999-9999',
    website: 'www.artesanatosdamaria.com.br',
    socialMedia: {
      instagram: '@artesanatosdamaria',
      whatsapp: '5511999999999'
    },
    businessHours: {
      monday: '9:00 - 18:00',
      tuesday: '9:00 - 18:00',
      wednesday: '9:00 - 18:00',
      thursday: '9:00 - 18:00',
      friday: '9:00 - 18:00',
      saturday: '9:00 - 14:00',
      sunday: 'Fechado'
    },
    policies: {
      returns: 'Aceito devoluções em até 7 dias',
      shipping: 'Envio para todo o Brasil via Correios',
      customization: 'Aceito encomendas personalizadas'
    }
  },
  {
    id: '2',
    name: 'Doces & Delícias',
    description: 'Confeitaria artesanal especializada em doces gourmet, bolos personalizados e presentes comestíveis para todas as ocasiões.',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20baker%20chef%20woman%20smiling%20kitchen%20uniform&image_size=square',
    coverImage: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=bakery%20colorful%20cakes%20sweets%20display%20elegant&image_size=landscape_16_9',
    rating: 4.9,
    reviewCount: 203,
    location: 'Rio de Janeiro, RJ',
    verified: true,
    specialties: ['Confeitaria', 'Bolos Personalizados', 'Doces Gourmet'],
    responseTime: '1h',
    joinedAt: '2022-08-20',
    productCount: 78,
    email: 'contato@docesdelicias.com',
    phone: '(21) 98888-8888',
    socialMedia: {
      instagram: '@docesdelicias',
      facebook: 'Doces e Delícias',
      whatsapp: '5521988888888'
    },
    businessHours: {
      monday: '8:00 - 19:00',
      tuesday: '8:00 - 19:00',
      wednesday: '8:00 - 19:00',
      thursday: '8:00 - 19:00',
      friday: '8:00 - 19:00',
      saturday: '8:00 - 16:00',
      sunday: '10:00 - 16:00'
    },
    policies: {
      returns: 'Produtos perecíveis não aceito devolução',
      shipping: 'Entrega local e envio refrigerado',
      customization: 'Especialista em encomendas personalizadas'
    }
  },
  {
    id: '3',
    name: 'Flores & Jardins',
    description: 'Floricultura especializada em arranjos únicos, plantas ornamentais e presentes naturais que transmitem carinho e beleza.',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=florist%20woman%20smiling%20flowers%20garden%20natural%20lighting&image_size=square',
    rating: 4.7,
    reviewCount: 89,
    location: 'Belo Horizonte, MG',
    verified: false,
    specialties: ['Floricultura', 'Arranjos', 'Plantas Ornamentais'],
    responseTime: '3h',
    joinedAt: '2023-03-10',
    productCount: 32,
    email: 'flores@jardins.com',
    phone: '(31) 97777-7777',
    socialMedia: {
      instagram: '@floresjardins',
      whatsapp: '5531977777777'
    },
    businessHours: {
      monday: '7:00 - 17:00',
      tuesday: '7:00 - 17:00',
      wednesday: '7:00 - 17:00',
      thursday: '7:00 - 17:00',
      friday: '7:00 - 17:00',
      saturday: '7:00 - 15:00',
      sunday: 'Fechado'
    },
    policies: {
      returns: 'Plantas com garantia de 15 dias',
      shipping: 'Entrega cuidadosa para preservar as plantas',
      customization: 'Arranjos personalizados sob encomenda'
    }
  }
];

export const useSellers = (initialFilters: SellerFilters = {}): UseSellersReturn => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SellerFilters>(initialFilters);

  const loadSellers = async (page: number = 1, currentFilters: SellerFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // TODO: Replace with actual Supabase query when sellers table is ready
      let filteredSellers = [...mockSellers];

      // Apply filters
      if (currentFilters.location) {
        filteredSellers = filteredSellers.filter(seller =>
          seller.location.toLowerCase().includes(currentFilters.location!.toLowerCase())
        );
      }

      if (currentFilters.specialty) {
        filteredSellers = filteredSellers.filter(seller =>
          seller.specialties.some(specialty =>
            specialty.toLowerCase().includes(currentFilters.specialty!.toLowerCase())
          )
        );
      }

      if (currentFilters.verified !== undefined) {
        filteredSellers = filteredSellers.filter(seller =>
          seller.verified === currentFilters.verified
        );
      }

      if (currentFilters.minRating) {
        filteredSellers = filteredSellers.filter(seller =>
          seller.rating >= currentFilters.minRating!
        );
      }

      // Apply sorting
      if (currentFilters.sortBy) {
        filteredSellers.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (currentFilters.sortBy) {
            case 'rating':
              aValue = a.rating;
              bValue = b.rating;
              break;
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'joinedAt':
              aValue = new Date(a.joinedAt);
              bValue = new Date(b.joinedAt);
              break;
            case 'productCount':
              aValue = a.productCount || 0;
              bValue = b.productCount || 0;
              break;
            default:
              return 0;
          }

          if (currentFilters.sortOrder === 'desc') {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }

      setTotalCount(filteredSellers.length);

      // Pagination
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedSellers = filteredSellers.slice(0, endIndex);

      if (page === 1) {
        setSellers(paginatedSellers);
      } else {
        setSellers(prev => [...prev, ...paginatedSellers.slice(startIndex)]);
      }

      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadSellers(currentPage + 1);
    }
  };

  const refresh = () => {
    setCurrentPage(1);
    loadSellers(1);
  };

  const updateFilters = (newFilters: SellerFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadSellers(1, newFilters);
  };

  const hasMore = sellers.length < totalCount;

  useEffect(() => {
    loadSellers();
  }, []);

  return {
    sellers,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refresh,
    filters,
    setFilters: updateFilters,
  };
};

export const useSeller = (sellerId: string): UseSellerReturn => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSeller = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // TODO: Replace with actual Supabase query when sellers table is ready
      const foundSeller = mockSellers.find(s => s.id === sellerId);
      
      if (foundSeller) {
        setSeller(foundSeller);
      } else {
        setError('Vendedor não encontrado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadSeller();
  };

  useEffect(() => {
    if (sellerId) {
      loadSeller();
    }
  }, [sellerId]);

  return {
    seller,
    loading,
    error,
    refresh,
  };
};