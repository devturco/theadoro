import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Calendar, Heart, User, ShoppingBag, Store } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, roles, loading } = useAuth();
  const { isAdmin, isSeller } = useRole();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);



  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Debug Dump */}
      <div className="container mx-auto px-4 py-4 bg-muted mb-4 rounded text-xs font-mono">
        <p>User ID: {user?.id}</p>
        <p>Roles: {JSON.stringify(roles)}</p>
        <p>Profile Role: {profile?.role}</p>
      </div>
      {/* End Debug Dump */}

      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-wine mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">
            Bem-vindo(a), {profile?.full_name || user?.email}
          </p>
        </div>

        <Tabs defaultValue="buyer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="buyer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Comprador
            </TabsTrigger>
            {isSeller && (
              <TabsTrigger value="seller">
                <Store className="mr-2 h-4 w-4" />
                Vendedor
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="admin">
                <User className="mr-2 h-4 w-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Buyer Dashboard */}
          <TabsContent value="buyer" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-wine" />
                    Meus Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="wine" className="w-full" onClick={() => navigate('/dashboard/orders')}>
                    Ver Pedidos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-wine" />
                    Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="wine" className="w-full" onClick={() => navigate('/dashboard/appointments')}>
                    Ver Agendamentos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-wine" />
                    Favoritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="wine" className="w-full" onClick={() => navigate('/dashboard/wishlist')}>
                    Ver Favoritos
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Meus Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => navigate('/dashboard/profile')}>
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seller Dashboard */}
          {isSeller && (
            <TabsContent value="seller" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-wine" />
                      Meus Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="wine" className="w-full" onClick={() => navigate('/seller/products')}>
                      Gerenciar Produtos
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-scale">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-wine" />
                      Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="wine" className="w-full" onClick={() => navigate('/seller/sales')}>
                      Ver Vendas
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="hover-scale">
                  <CardHeader>
                    <CardTitle>Categorias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="wine" className="w-full" onClick={() => navigate('/admin/categories')}>
                      Gerenciar
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-scale">
                  <CardHeader>
                    <CardTitle>Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="wine" className="w-full" onClick={() => navigate('/admin/users')}>
                      Gerenciar
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-scale">
                  <CardHeader>
                    <CardTitle>Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="wine" className="w-full" onClick={() => navigate('/admin/orders')}>
                      Ver Todos
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
