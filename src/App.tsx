import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { MaintenanceGuard } from '@/components/auth/MaintenanceGuard';

// Layouts
import AdminLayout from '@/components/layouts/AdminLayout';
import SellerLayout from '@/components/layouts/SellerLayout';
import BuyerLayout from '@/components/layouts/BuyerLayout';
import PublicLayout from '@/components/layouts/PublicLayout';

// Public Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Public Marketplace Pages
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Categories from '@/pages/Categories';
import CategoryProducts from '@/pages/CategoryProducts';
import Search from '@/pages/Search';
import Wishlist from '@/pages/Wishlist';
import Sellers from '@/pages/Sellers';
import SellerProfile from '@/pages/SellerProfile';

// Institutional Pages
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';

// General Dashboard
import Dashboard from '@/pages/Dashboard';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReports from '@/pages/admin/AdminReports';
import AdminContent from '@/pages/admin/AdminContent';
import AdminSettings from '@/pages/admin/AdminSettings';

// Seller Pages
import SellerDashboard from '@/pages/seller/SellerDashboard';
import SellerProducts from '@/pages/seller/Products';
import SellerSales from '@/pages/seller/SellerSales';
import SellerAppointments from '@/pages/seller/SellerAppointments';
import SellerReports from '@/pages/seller/SellerReports';

// Buyer Pages
import BuyerDashboard from '@/pages/buyer/BuyerDashboard';
import BuyerOrders from '@/pages/buyer/BuyerOrders';
import BuyerAppointments from '@/pages/buyer/BuyerAppointments';
import BuyerWishlist from '@/pages/buyer/BuyerWishlist';
import BuyerProfile from '@/pages/buyer/BuyerProfile';
import OrderDetail from '@/pages/buyer/OrderDetail';
import SellerOnboarding from '@/pages/SellerOnboarding';
import AdminSellerApprovals from '@/pages/admin/AdminSellerApprovals';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

import ScrollToTop from '@/components/common/ScrollToTop';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<MaintenanceGuard><Index /></MaintenanceGuard>} />
                  <Route path="/auth" element={<Auth />} />

                  {/* Public Marketplace Routes */}
                  <Route path="/products" element={<MaintenanceGuard><PublicLayout><Products /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/product/:id" element={<MaintenanceGuard><PublicLayout><ProductDetail /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/products/:id" element={<MaintenanceGuard><PublicLayout><ProductDetail /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/categories" element={<MaintenanceGuard><PublicLayout><Categories /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/categories/:slug" element={<MaintenanceGuard><PublicLayout><CategoryProducts /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/search" element={<MaintenanceGuard><PublicLayout><Search /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/cart" element={<MaintenanceGuard><PublicLayout><Cart /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/checkout" element={<MaintenanceGuard><PublicLayout><Checkout /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/order-success/:id" element={<MaintenanceGuard><PublicLayout><OrderSuccess /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/wishlist" element={<MaintenanceGuard><PublicLayout><Wishlist /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/sellers" element={<MaintenanceGuard><PublicLayout><Sellers /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/sellers/:id" element={<MaintenanceGuard><PublicLayout><SellerProfile /></PublicLayout></MaintenanceGuard>} />

                  {/* Institutional Pages */}
                  <Route path="/about" element={<MaintenanceGuard><PublicLayout><About /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/contact" element={<MaintenanceGuard><PublicLayout><Contact /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/terms" element={<MaintenanceGuard><PublicLayout><Terms /></PublicLayout></MaintenanceGuard>} />
                  <Route path="/privacy" element={<MaintenanceGuard><PublicLayout><Privacy /></PublicLayout></MaintenanceGuard>} />

                  {/* General Dashboard */}
                  <Route
                    path="/dashboard"
                    element={
                      <MaintenanceGuard>
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </MaintenanceGuard>
                    }
                  />
                  <Route
                    path="/dashboard/profile"
                    element={
                      <MaintenanceGuard>
                        <ProtectedRoute>
                          <BuyerProfile />
                        </ProtectedRoute>
                      </MaintenanceGuard>
                    }
                  />

                  <Route path="/seller/onboarding" element={<MaintenanceGuard><PublicLayout><SellerOnboarding /></PublicLayout></MaintenanceGuard>} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['admin']}>
                          <AdminLayout>
                            <Routes>
                              <Route index element={<Navigate to="dashboard" replace />} />
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="approvals" element={<AdminSellerApprovals />} />
                              <Route path="products" element={<AdminProducts />} />
                              <Route path="categories" element={<AdminCategories />} />
                              <Route path="orders" element={<AdminOrders />} />
                              <Route path="reports" element={<AdminReports />} />
                              <Route path="content" element={<AdminContent />} />
                              <Route path="settings" element={<AdminSettings />} />
                              <Route path="*" element={<AdminDashboard />} />
                            </Routes>
                          </AdminLayout>
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Seller Routes */}
                  <Route
                    path="/seller/*"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['seller', 'admin']}>
                          <SellerLayout>
                            <Routes>
                              <Route path="dashboard" element={<SellerDashboard />} />
                              <Route path="products" element={<SellerProducts />} />
                              <Route path="sales" element={<SellerSales />} />
                              <Route path="appointments" element={<SellerAppointments />} />
                              <Route path="reports" element={<SellerReports />} />
                              <Route path="*" element={<SellerDashboard />} />
                            </Routes>
                          </SellerLayout>
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Buyer Routes */}
                  <Route
                    path="/buyer/*"
                    element={
                      <ProtectedRoute>
                        <RoleGuard allowedRoles={['buyer', 'admin']}>
                          <BuyerLayout>
                            <Routes>
                              <Route path="dashboard" element={<BuyerDashboard />} />
                              <Route path="orders" element={<BuyerOrders />} />
                              <Route path="orders/:id" element={<OrderDetail />} />
                              <Route path="appointments" element={<BuyerAppointments />} />
                              <Route path="wishlist" element={<BuyerWishlist />} />
                              <Route path="profile" element={<BuyerProfile />} />
                              <Route path="*" element={<BuyerDashboard />} />
                            </Routes>
                          </BuyerLayout>
                        </RoleGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
