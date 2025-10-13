# Implementação de Páginas Públicas - THEADORO Gift Marketplace

## 1. Visão Geral

Este documento detalha a implementação de todas as páginas públicas necessárias para completar o THEADORO Gift Marketplace. O projeto já possui as páginas administrativas (admin, seller, buyer) e precisa das páginas públicas para funcionamento completo do marketplace.

## 2. Páginas Públicas Necessárias

### 2.1 Páginas Principais do Marketplace

| Página | Rota | Prioridade | Descrição |
|--------|------|------------|-----------|
| **Produtos** | `/products` | Alta | Listagem geral de todos os produtos com filtros |
| **Produto Individual** | `/products/:id` | Alta | Detalhes completos de um produto específico |
| **Categorias** | `/categories` | Alta | Listagem de todas as categorias disponíveis |
| **Categoria Específica** | `/categories/:slug` | Alta | Produtos filtrados por categoria |
| **Vendedores** | `/sellers` | Média | Listagem de vendedores da plataforma |
| **Vendedor Individual** | `/sellers/:id` | Média | Perfil público do vendedor |
| **Carrinho** | `/cart` | Alta | Carrinho de compras do usuário |
| **Checkout** | `/checkout` | Alta | Finalização da compra |
| **Busca** | `/search` | Alta | Resultados de pesquisa com filtros |

### 2.2 Páginas Institucionais

| Página | Rota | Prioridade | Descrição |
|--------|------|------------|-----------|
| **Sobre** | `/about` | Baixa | Informações sobre a empresa |
| **Contato** | `/contact` | Baixa | Formulário de contato |
| **Termos de Uso** | `/terms` | Baixa | Termos e condições |
| **Política de Privacidade** | `/privacy` | Baixa | Política de privacidade |
| **FAQ** | `/faq` | Baixa | Perguntas frequentes |

## 3. Componentes Reutilizáveis Necessários

### 3.1 Componentes de Produto

```typescript
// ProductCard.tsx - Card de produto para listagens
interface ProductCardProps {
  product: Product;
  showWishlist?: boolean;
  showQuickView?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

// ProductGrid.tsx - Grid responsivo de produtos
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
  showPagination?: boolean;
}

// ProductCarousel.tsx - Carrossel de produtos
interface ProductCarouselProps {
  products: Product[];
  title?: string;
  autoPlay?: boolean;
  showDots?: boolean;
}

// ProductGallery.tsx - Galeria de imagens do produto
interface ProductGalleryProps {
  images: string[];
  productName: string;
  showThumbnails?: boolean;
  enableZoom?: boolean;
}
```

### 3.2 Componentes de Navegação e Filtros

```typescript
// FilterSidebar.tsx - Sidebar de filtros
interface FilterSidebarProps {
  categories: Category[];
  priceRange: [number, number];
  onFiltersChange: (filters: ProductFilters) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

// Breadcrumbs.tsx - Navegação breadcrumb
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

// SearchBar.tsx - Barra de busca avançada
interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  suggestions?: string[];
}

// Pagination.tsx - Componente de paginação
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}
```

### 3.3 Componentes de Carrinho e Checkout

```typescript
// CartItem.tsx - Item do carrinho
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  readonly?: boolean;
}

// CartSummary.tsx - Resumo do carrinho
interface CartSummaryProps {
  items: CartItem[];
  shipping?: number;
  discount?: number;
  showCheckoutButton?: boolean;
}

// CheckoutForm.tsx - Formulário de checkout
interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  loading?: boolean;
  cartItems: CartItem[];
}
```

### 3.4 Componentes de Avaliação e Social

```typescript
// ReviewSystem.tsx - Sistema de avaliações
interface ReviewSystemProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  canReview?: boolean;
}

// WishlistButton.tsx - Botão de favoritos
interface WishlistButtonProps {
  productId: string;
  isInWishlist: boolean;
  onToggle: (productId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

// ShareButton.tsx - Botão de compartilhamento
interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  platforms?: ('facebook' | 'twitter' | 'whatsapp' | 'email')[];
}
```

## 4. Estrutura de Dados

### 4.1 Interfaces TypeScript

```typescript
// Product Interface
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  seller: Seller;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity?: number;
  tags: string[];
  specifications?: Record<string, string>;
  isService: boolean;
  serviceDetails?: ServiceDetails;
  createdAt: string;
  updatedAt: string;
}

// Category Interface
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productCount: number;
}

// Seller Interface
interface Seller {
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
}

// Cart Interface
interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  serviceDate?: string;
  serviceTime?: string;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}
```

### 4.2 Filtros e Busca

```typescript
// Product Filters
interface ProductFilters {
  categories?: string[];
  priceRange?: [number, number];
  rating?: number;
  location?: string;
  isService?: boolean;
  inStock?: boolean;
  tags?: string[];
  sellerId?: string;
}

// Search Filters
interface SearchFilters extends ProductFilters {
  query: string;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

// Pagination
interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

## 5. Hooks Personalizados Necessários

### 5.1 Hooks de Produto

```typescript
// useProducts.ts - Hook para listagem de produtos
export const useProducts = (filters?: ProductFilters, pagination?: PaginationOptions) => {
  // Implementação com React Query
  // Retorna: { products, loading, error, refetch, pagination }
}

// useProduct.ts - Hook para produto individual
export const useProduct = (productId: string) => {
  // Implementação com React Query
  // Retorna: { product, loading, error, refetch }
}

// useProductSearch.ts - Hook para busca de produtos
export const useProductSearch = (searchFilters: SearchFilters) => {
  // Implementação com React Query e debounce
  // Retorna: { results, loading, error, suggestions }
}
```

### 5.2 Hooks de Carrinho

```typescript
// useCart.ts - Hook para gerenciamento do carrinho
export const useCart = () => {
  // Implementação com Context API + localStorage
  // Retorna: { cart, addItem, removeItem, updateQuantity, clearCart, total }
}

// useCheckout.ts - Hook para processo de checkout
export const useCheckout = () => {
  // Implementação com integração de pagamento
  // Retorna: { processOrder, loading, error, success }
}
```

### 5.3 Hooks de Favoritos

```typescript
// useWishlist.ts - Hook para lista de favoritos
export const useWishlist = () => {
  // Implementação com Supabase
  // Retorna: { wishlist, addToWishlist, removeFromWishlist, isInWishlist }
}
```

## 6. Integração com Supabase

### 6.1 Tabelas Necessárias

```sql
-- Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id),
  seller_id UUID REFERENCES profiles(id),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  tags TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  is_service BOOLEAN DEFAULT false,
  service_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES categories(id),
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carrinho
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_options JSONB DEFAULT '{}',
  service_date DATE,
  service_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Lista de favoritos
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Avaliações
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);
```

### 6.2 Políticas RLS (Row Level Security)

```sql
-- Produtos - Leitura pública, escrita apenas para vendedores
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos são visíveis para todos" ON products
  FOR SELECT USING (true);

CREATE POLICY "Vendedores podem inserir produtos" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendedores podem atualizar seus produtos" ON products
  FOR UPDATE USING (auth.uid() = seller_id);

-- Carrinho - Apenas o próprio usuário
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio carrinho" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist - Apenas o próprio usuário
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sua própria wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Reviews - Leitura pública, escrita para usuários autenticados
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews são visíveis para todos" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 7. Serviços e APIs

### 7.1 Product Service

```typescript
// services/product.service.ts
export class ProductService extends BaseService<Product> {
  constructor() {
    super('products');
  }

  async getProducts(filters?: ProductFilters, pagination?: PaginationOptions) {
    // Implementação com filtros e paginação
  }

  async searchProducts(query: string, filters?: SearchFilters) {
    // Implementação de busca com full-text search
  }

  async getProductsByCategory(categorySlug: string, pagination?: PaginationOptions) {
    // Produtos filtrados por categoria
  }

  async getProductsBySeller(sellerId: string, pagination?: PaginationOptions) {
    // Produtos de um vendedor específico
  }

  async getFeaturedProducts(limit?: number) {
    // Produtos em destaque
  }

  async getRelatedProducts(productId: string, limit?: number) {
    // Produtos relacionados
  }
}
```

### 7.2 Cart Service

```typescript
// services/cart.service.ts
export class CartService {
  async getCartItems(userId: string): Promise<CartItem[]> {
    // Buscar itens do carrinho do usuário
  }

  async addToCart(userId: string, productId: string, quantity: number, options?: any) {
    // Adicionar item ao carrinho
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    // Atualizar quantidade do item
  }

  async removeFromCart(userId: string, itemId: string) {
    // Remover item do carrinho
  }

  async clearCart(userId: string) {
    // Limpar carrinho
  }

  async calculateTotal(items: CartItem[]): Promise<CartSummary> {
    // Calcular totais do carrinho
  }
}
```

### 7.3 Category Service

```typescript
// services/category.service.ts
export class CategoryService extends BaseService<Category> {
  constructor() {
    super('categories');
  }

  async getCategoriesTree(): Promise<Category[]> {
    // Buscar categorias em estrutura hierárquica
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    // Buscar categoria por slug
  }

  async getPopularCategories(limit?: number): Promise<Category[]> {
    // Categorias mais populares
  }
}
```

## 8. Roteamento Atualizado

### 8.1 Novas Rotas no App.tsx

```typescript
// Adicionar ao App.tsx
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Categories from '@/pages/Categories';
import CategoryProducts from '@/pages/CategoryProducts';
import Sellers from '@/pages/Sellers';
import SellerProfile from '@/pages/SellerProfile';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Search from '@/pages/Search';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';

// Rotas públicas adicionais
<Route path="/products" element={<Products />} />
<Route path="/products/:id" element={<ProductDetail />} />
<Route path="/categories" element={<Categories />} />
<Route path="/categories/:slug" element={<CategoryProducts />} />
<Route path="/sellers" element={<Sellers />} />
<Route path="/sellers/:id" element={<SellerProfile />} />
<Route path="/cart" element={<Cart />} />
<Route path="/checkout" element={<Checkout />} />
<Route path="/search" element={<Search />} />
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
```

## 9. Contextos Necessários

### 9.1 Cart Context

```typescript
// contexts/CartContext.tsx
interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity: number, options?: any) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  cartCount: number;
  cartTotal: number;
}
```

### 9.2 Wishlist Context

```typescript
// contexts/WishlistContext.tsx
interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}
```

## 10. Funcionalidades Avançadas

### 10.1 Sistema de Busca

- **Full-text search** no Supabase
- **Autocomplete** com sugestões
- **Filtros avançados** (preço, categoria, localização, avaliação)
- **Histórico de buscas** do usuário
- **Busca por voz** (opcional)

### 10.2 Sistema de Recomendações

- **Produtos relacionados** baseados em categoria
- **Produtos visualizados recentemente**
- **Recomendações personalizadas** baseadas no histórico
- **Produtos populares** na categoria

### 10.3 Sistema de Avaliações

- **Avaliações com estrelas** (1-5)
- **Comentários textuais**
- **Fotos nas avaliações** (opcional)
- **Filtros de avaliações** (por estrelas, mais úteis)
- **Resposta do vendedor** às avaliações

### 10.4 SEO e Performance

- **Meta tags dinâmicas** para cada página
- **Structured data** para produtos
- **Lazy loading** de imagens
- **Infinite scroll** ou paginação
- **Cache de dados** com React Query
- **Otimização de imagens** com Supabase Storage

## 11. Responsividade e UX

### 11.1 Design Mobile-First

- **Navegação mobile** com menu hambúrguer
- **Cards responsivos** que se adaptam ao tamanho da tela
- **Touch gestures** para carrosséis e galerias
- **Filtros em modal** no mobile
- **Checkout otimizado** para mobile

### 11.2 Estados de Loading

- **Skeleton screens** para carregamento
- **Loading spinners** para ações
- **Estados vazios** com ilustrações
- **Mensagens de erro** amigáveis
- **Retry mechanisms** para falhas de rede

## 12. Cronograma de Implementação

### Fase 1 - Páginas Essenciais (Semana 1-2)
1. Página de Produtos (`/products`)
2. Detalhes do Produto (`/products/:id`)
3. Carrinho (`/cart`)
4. Checkout (`/checkout`)

### Fase 2 - Categorias e Busca (Semana 3)
1. Página de Categorias (`/categories`)
2. Produtos por Categoria (`/categories/:slug`)
3. Página de Busca (`/search`)

### Fase 3 - Vendedores e Social (Semana 4)
1. Página de Vendedores (`/sellers`)
2. Perfil do Vendedor (`/sellers/:id`)
3. Sistema de Avaliações
4. Lista de Favoritos

### Fase 4 - Páginas Institucionais (Semana 5)
1. Sobre (`/about`)
2. Contato (`/contact`)
3. Termos (`/terms`)
4. Privacidade (`/privacy`)

### Fase 5 - Otimizações e Testes (Semana 6)
1. SEO e Performance
2. Testes de responsividade
3. Testes de usabilidade
4. Correções e ajustes finais

## 13. Considerações Técnicas

### 13.1 Performance
- Implementar **React.memo** em componentes pesados
- Usar **useMemo** e **useCallback** adequadamente
- **Code splitting** por rotas
- **Lazy loading** de componentes não críticos

### 13.2 Acessibilidade
- **ARIA labels** em todos os componentes interativos
- **Navegação por teclado** funcional
- **Contraste adequado** de cores
- **Alt text** em todas as imagens

### 13.3 Segurança
- **Validação de dados** no frontend e backend
- **Sanitização** de inputs do usuário
- **Rate limiting** para APIs
- **HTTPS** obrigatório em produção

Este documento serve como guia completo para implementação de todas as páginas públicas necessárias para o funcionamento completo do THEADORO Gift Marketplace.