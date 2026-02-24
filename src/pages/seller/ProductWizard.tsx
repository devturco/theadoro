import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductWizard } from '@/hooks/useProductWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { productService } from '@/services/product.service';
import { useAuth } from '@/contexts/AuthContext';

// Steps Components
import ProductTypeStep from './steps/ProductTypeStep';
import BasicInfoStep from './steps/BasicInfoStep';
import VariationsStep from './steps/VariationsStep';
import ShippingStep from './steps/ShippingStep';

export default function ProductWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        currentStep,
        totalSteps,
        prevStep,
        nextStep,
        productData,
        productType,
        categoryId,
        subcategoryId,
        variations,
        reset
    } = useProductWizard();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Progress calculation
    const progress = (currentStep / totalSteps) * 100;

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <ProductTypeStep />;
            case 2: return <BasicInfoStep />;
            case 3: return <VariationsStep />;
            case 4: return <ShippingStep />;
            default: return <BasicInfoStep />;
        }
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Product Type & Category
                if (!productType) {
                    toast.error('Selecione um tipo de produto.');
                    return false;
                }
                if (!categoryId) {
                    toast.error('Selecione uma categoria.');
                    return false;
                }
                return true;

            case 2: // Basic Info
                if (!productData.name?.trim()) {
                    toast.error('O título do anúncio é obrigatório.');
                    return false;
                }
                if (!productData.price || productData.price <= 0) {
                    toast.error('O preço deve ser maior que zero.');
                    return false;
                }
                if (!productData.description?.trim()) {
                    toast.error('A descrição é obrigatória.');
                    return false;
                }
                if ((productData.images?.length || 0) === 0) {
                    toast.error('Adicione pelo menos uma imagem.');
                    return false;
                }
                return true;

            case 3: // Variations
                if (variations.length > 0) {
                    const invalidVariation = variations.find(v => !v.price || v.price <= 0);
                    if (invalidVariation) {
                        toast.error('Todas as variações devem ter preço maior que zero.');
                        return false;
                    }
                }
                return true;

            case 4: // Shipping
                if (productType === 'physical') {
                    const { height, width, depth, weight } = productData.shipping_info || {};
                    // Basic validation
                    if (!height || !width || !depth || !weight) {
                        toast.error('Preencha todas as dimensões e peso.');
                        return false;
                    }
                    if (height <= 0 || width <= 0 || depth <= 0 || weight <= 0) {
                        toast.error('Dimensões e peso devem ser maiores que zero.');
                        return false;
                    }
                }
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            nextStep();
        }
    };

    const handleFinish = async () => {
        if (!validateStep(currentStep)) return;

        if (!user) {
            toast.error('Você precisa estar logado para publicar.');
            return;
        }

        if (!productData.name || !categoryId) {
            toast.error('Preencha as informações obrigatórias (Nome, Categoria).');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Prepare Product Data
            const newProduct = {
                ...productData,
                seller_id: user.id,
                category_id: subcategoryId || categoryId, // Use subcategory if selected, else parent category? 
                // Actually schema usually expects one category_id. 
                // If your logic requires validation that subcategory is selected if available:
                // For now let's assume category_id is the target.
                type: productType,
                // Ensure numeric values
                price: Number(productData.price),
                stock_quantity: Number(productData.stock_quantity),
            };

            // 2. Insert Product
            const { data: product, error: productError } = await productService.create(newProduct);

            if (productError) throw productError;

            // 3. Insert Variations (if any)
            if (variations.length > 0 && product) {
                const variationsToInsert = variations.map(v => ({
                    ...v,
                    product_id: product.id,
                    price: v.price ? Number(v.price) : null,
                    weight: v.weight ? Number(v.weight) : null,
                }));

                const { error: variationsError } = await productService.addVariations(variationsToInsert);

                if (variationsError) {
                    console.error('Error saving variations:', variationsError);
                    toast.error('Produto criado, mas houve erro ao salvar variações.');
                    // Don't throw here, allowing redirect
                }
            }

            toast.success('Produto publicado com sucesso!');
            reset(); // Clear wizard state
            navigate('/seller/products');

        } catch (error: any) {
            console.error('Error publishing product:', error);
            toast.error(error.message || 'Erro ao publicar produto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Progress */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-sans text-gradient-wine">
                        Adicionar Novo Produto
                    </h1>
                    <span className="text-sm font-medium text-gray-500">
                        Etapa {currentStep} de {totalSteps}
                    </span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-wine" />
            </div>

            {/* Main Content Card */}
            <Card className="border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                    {renderStep()}
                </CardContent>
            </Card>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-4">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className="rounded-xl px-6 h-12 border-gray-200 hover:bg-gray-50 hover:text-wine transition-all"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                {currentStep === totalSteps ? (
                    <Button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="rounded-xl px-8 h-12 bg-wine hover:bg-wine/90 shadow-wine transition-all hover:scale-105 active:scale-95 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            <>
                                Finalizar e Publicar
                                <Check className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="rounded-xl px-8 h-12 bg-wine hover:bg-wine/90 shadow-wine transition-all hover:scale-105 active:scale-95 text-white"
                    >
                        Próxima Etapa
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
