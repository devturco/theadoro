import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';

// Layouts
import AdminLayout from '@/components/layouts/AdminLayout';
import SellerLayout from '@/components/layouts/SellerLayout';
import BuyerLayout from '@/components/layouts/BuyerLayout';

// Public Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// General Dashboard
import Dashboard from '@/pages/Dashboard';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReports from '@/pages/admin/AdminReports';

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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* General Dashboard (redirects based on role) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['admin']}>
                      <AdminLayout>
                        <Routes>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="products" element={<AdminProducts />} />
                          <Route path="categories" element={<AdminCategories />} />
                          <Route path="orders" element={<AdminOrders />} />
                          <Route path="reports" element={<AdminReports />} />
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
