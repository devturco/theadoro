import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedSellers from "@/components/FeaturedSellers";
import Footer from "@/components/Footer";
import HomeMarketplaceTop from "@/components/home/HomeMarketplaceTop";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HomeMarketplaceTop />
        <Categories />
        <FeaturedProducts />
        <FeaturedSellers />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
