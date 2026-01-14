import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedSellers from "@/components/FeaturedSellers";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32">
        <Hero />
        <Categories />
        <FeaturedProducts />
        <FeaturedSellers />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
