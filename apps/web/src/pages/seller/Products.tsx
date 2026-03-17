import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@theadoro/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@theadoro/ui';
import { Plus, Edit, Trash2, Eye, EyeOff, ShoppingBag, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@theadoro/ui';
import { cn } from '@/lib/utils';

const SellerProducts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isApproved = profile?.is_approved === true;

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          reviews (rating)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar produtos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentStatus ? 'Produto desativado' : 'Produto ativado');
      fetchProducts();
    } catch (error: any) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Produto excluído');
      fetchProducts();
    } catch (error: any) {
      toast.error('Erro ao excluir produto');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-wine border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando seus produtos...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-sans text-gradient-wine mb-1">Meus Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seu catálogo de {products.length === 1 ? '1 produto' : `${products.length} produtos`}
          </p>
        </div>
        <Button
          variant="wine"
          onClick={() => isApproved ? navigate('/seller/products/new') : toast.error('Sua conta ainda não foi aprovada para publicar produtos.')}
          className={cn("shadow-md hover:shadow-wine transition-all", !isApproved && "opacity-50 cursor-not-allowed")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Anúncio
        </Button>
      </div>

      {!isApproved && (
        <Alert className="bg-amber-50 border-amber-200 mb-8 rounded-2xl p-6 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div className="ml-3">
            <h4 className="font-bold text-amber-900 mb-1">Conta em Análise</h4>
            <AlertDescription className="text-amber-800 text-sm">
              Sua conta de lojista está aguardando validação. Você poderá cadastrar e publicar produtos assim que nossa equipe concluir a revisão da sua documentação.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {products.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-wine/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-wine/10">
            <ShoppingBag className="h-10 w-10 text-wine/40" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">Comece seu Catálogo</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Você ainda não criou nenhum anúncio. Adicione seu primeiro item para começar a vender.
          </p>
          <Button
            variant="wine"
            size="lg"
            onClick={() => isApproved ? navigate('/seller/products/new') : toast.error('Conta em análise.')}
            className={cn("rounded-full px-8 shadow-wine transition-all", !isApproved && "opacity-50 cursor-not-allowed")}
          >
            Criar Primeiro Anúncio
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden rounded-2xl border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden bg-gray-50 relative group">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">
                    <Package className="h-12 w-12 mb-2 opacity-20" />
                    <span>Sem imagem</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${product.is_active
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-400 text-white'
                    }`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-wine/60 uppercase tracking-widest mb-1 truncate">
                    {product.categories?.name || 'Sem Categoria'}
                  </p>
                  <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1 mb-2 group-hover:text-wine transition-colors">
                    {product.name}
                  </CardTitle>
                  <p className="text-xl font-bold text-gray-900 font-sans">
                    <span className="text-sm font-medium mr-1 text-gray-400">R$</span>
                    {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg border-gray-200 hover:border-wine hover:text-wine font-semibold transition-all"
                    onClick={() => navigate(`/seller/products/${product.id}`)}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-gray-200 hover:bg-gray-50 text-gray-500 transition-all"
                    onClick={() => toggleActive(product.id, product.is_active)}
                    title={product.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-gray-400 transition-all"
                    onClick={() => deleteProduct(product.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
