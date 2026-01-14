import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useProducts } from '@/hooks/useProducts';
import { useCRUD } from '@/hooks/useCRUD';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, ProductType } from '@/types/product';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  type: ProductType;
  is_active: boolean;
  images: string[];
  slug: string;
}

const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // decomposes accents
    .replace(/[\u0300-\u036f]/g, '') // removes accents
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/[^\w\-]+/g, '') // remove non-words
    .replace(/\-\-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim start
    .replace(/-+$/, ''); // trim end
};

const AdminProducts = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    category_id: '',
    type: 'physical',
    is_active: true,
    images: [],
    slug: ''
  });

  const {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    refetch
  } = useProducts();

  const { data: categories } = useCRUD({ table: 'categories' });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
      return;
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduct({
          ...formData,
          seller_id: user?.id || ''
        });
        toast.success('Produto criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity || 0,
      category_id: product.category_id || '',
      type: product.type,
      is_active: product.is_active,
      images: product.images || [],
      slug: product.slug || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await deleteProduct(productId);
      toast.success('Produto excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await toggleProductStatus(product.id);
      toast.success(`Produto ${product.is_active ? 'desativado' : 'ativado'} com sucesso!`);
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do produto');
    }
  };

  const handleImageUpload = (urls: string[]) => {
    setFormData({ ...formData, images: [...formData.images, ...urls] });
  };

  const handleImageRemove = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      category_id: '',
      type: 'physical',
      is_active: true,
      images: [],
      slug: ''
    });
    setEditingProduct(null);
  };

  const columns = [
    {
      key: 'images',
      label: 'Imagem',
      render: (images: string[]) => (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
          {images?.[0] ? (
            <img
              src={images[0]}
              alt="Produto"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Nome'
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (_: any, row: Product) => {
        const category = categories?.find((cat: any) => cat.id === row.category_id);
        return category?.name || 'N/A';
      }
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (type: ProductType) => (
        <Badge variant={type === 'physical' ? 'default' : 'secondary'}>
          {type === 'physical' ? 'Físico' : 'Serviço'}
        </Badge>
      )
    },
    {
      key: 'price',
      label: 'Preço',
      render: (price: number) => `R$ ${price.toFixed(2)}`
    },
    {
      key: 'stock_quantity',
      label: 'Estoque',
      render: (stock: number, row: Product) => (
        <div className="flex items-center gap-2">
          <span>{stock || 0}</span>
          {stock < 10 && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (isActive: boolean) => (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'seller',
      label: 'Vendedor',
      render: (_: any, row: Product) => row.seller?.name || 'N/A'
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: Product) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row)}
          >
            {row.is_active ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os produtos da plataforma
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? 'Edite as informações do produto abaixo.'
                  : 'Preencha as informações para criar um novo produto.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug (URL Amigável)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="nome-do-produto"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stock">Estoque</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Produto Físico</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Imagens do Produto</Label>
                  <FileUpload
                    onUpload={handleImageUpload}
                    accept="image/*"
                    multiple
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Produto ${index + 1}`}
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => handleImageRemove(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products || []}
            columns={columns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Buscar produtos..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;