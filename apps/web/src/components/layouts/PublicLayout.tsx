import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { FloatingWhatsApp } from '@/components/common/FloatingWhatsApp';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14 sm:pt-16">
        {children || <Outlet />}
      </main>
      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default PublicLayout;