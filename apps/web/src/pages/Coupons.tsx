import { useState } from 'react';
import { Button } from '@theadoro/ui';
import { Check, Copy, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Coupon {
    code: string;
    description: string;
    discount: string;
    validUntil: string;
    color: string;
}

const MOCK_COUPONS: Coupon[] = [
    {
        code: 'BEMVINDO10',
        description: '10% de desconto na sua primeira compra',
        discount: '10% OFF',
        validUntil: 'Válido por tempo limitado',
        color: 'bg-green-50 border-green-100 text-green-700'
    },
    {
        code: 'FRETEGRATIS',
        description: 'Frete grátis para compras acima de R$ 199',
        discount: 'Frete Grátis',
        validUntil: 'Válido para sul e sudeste',
        color: 'bg-blue-50 border-blue-100 text-blue-700'
    },
    {
        code: 'AMOR15',
        description: '15% OFF em toda categoria de Flores',
        discount: '15% OFF',
        validUntil: 'Válido até 30/06',
        color: 'bg-pink-50 border-pink-100 text-pink-700'
    }
];

const Coupons = () => {
    const { toast } = useToast();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({
            title: "Cupom copiado!",
            description: `O código ${code} foi copiado para sua área de transferência.`,
        });

        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center p-3 bg-wine/10 rounded-full mb-4">
                        <Ticket className="w-8 h-8 text-wine" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
                        Cupons de Desconto
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Economize em seus presentes favoritos com nossos cupons exclusivos.
                    </p>
                </div>

                {/* Coupons Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {MOCK_COUPONS.map((coupon, index) => (
                        <div
                            key={coupon.code}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={cn("px-4 py-1.5 rounded-full text-xs font-bold mb-4 uppercase tracking-wider", coupon.color)}>
                                {coupon.discount}
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-1 tracking-widest font-mono">
                                {coupon.code}
                            </h3>

                            <p className="text-gray-600 mb-6 flex-1">
                                {coupon.description}
                            </p>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={() => handleCopy(coupon.code)}
                                    className={cn(
                                        "w-full font-bold transition-all",
                                        copiedCode === coupon.code
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-gray-900 hover:bg-gray-800"
                                    )}
                                >
                                    {copiedCode === coupon.code ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copiar Código
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-gray-400">
                                    {coupon.validUntil}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Coupons;
