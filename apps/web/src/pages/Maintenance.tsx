import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <div className="space-y-6 max-w-md animate-fade-in">
                {/* Logo */}
                <div className="w-24 h-24 mx-auto mb-8">
                    <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                    Estaremos online em breve!
                </h1>

                <p className="text-lg text-muted-foreground">
                    Estamos realizando algumas melhorias para tornar sua experiência incrível.
                    Voltaremos em breve.
                </p>

                <div className="pt-8">
                    <Link to="/auth">
                        <Button variant="outline" className="gap-2">
                            <LogIn className="w-4 h-4" />
                            Acesso Administrativo
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
