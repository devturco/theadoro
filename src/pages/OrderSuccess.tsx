import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrderSuccess: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Pedido Realizado!</h1>
                    <p className="text-gray-600">
                        Seu pedido foi confirmado e já está sendo processado.
                    </p>
                    <div className="pt-2">
                        <span className="text-sm text-gray-500 uppercase tracking-wide">Número do Pedido</span>
                        <p className="text-lg font-mono font-medium text-gray-900 select-all">
                            #{id?.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/buyer/orders')}
                    >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Meus Pedidos
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/')}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Voltar para Loja
                    </Button>
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <p>Você receberá um e-mail com os detalhes da compra.</p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
