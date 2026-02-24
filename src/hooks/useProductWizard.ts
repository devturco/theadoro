import { create } from 'zustand';
import { Product, ProductVariation, ProductType } from '@/types/product';

interface ProductWizardState {
    currentStep: number;
    totalSteps: number;
    productType: ProductType;
    categoryId: string;
    subcategoryId: string | null;
    productData: Partial<Product>;
    variations: Partial<ProductVariation>[];

    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setProductType: (type: ProductType) => void;
    setCategory: (categoryId: string, subcategoryId?: string) => void;
    updateProductData: (data: Partial<Product>) => void;
    addVariation: (variation: Partial<ProductVariation>) => void;
    removeVariation: (index: number) => void;
    updateVariation: (index: number, data: Partial<ProductVariation>) => void;
    reset: () => void;
}

const initialProductData = {
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    images: [],
    tags: [],
    is_active: true,
    is_service: false,
};

export const useProductWizard = create<ProductWizardState>((set) => ({
    currentStep: 1,
    totalSteps: 4,
    productType: 'physical',
    categoryId: '',
    subcategoryId: null,
    productData: initialProductData,
    variations: [],

    setStep: (step) => set({ currentStep: step }),
    nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps) })),
    prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

    setProductType: (type) => set({ productType: type }),

    setCategory: (categoryId, subcategoryId = undefined) => set({ categoryId, subcategoryId: subcategoryId || null }),

    updateProductData: (data) => set((state) => ({
        productData: { ...state.productData, ...data }
    })),

    addVariation: (variation) => set((state) => ({
        variations: [...state.variations, variation]
    })),

    removeVariation: (index) => set((state) => ({
        variations: state.variations.filter((_, i) => i !== index)
    })),

    updateVariation: (index, data) => set((state) => ({
        variations: state.variations.map((v, i) => i === index ? { ...v, ...data } : v)
    })),

    reset: () => set({
        currentStep: 1,
        productType: 'physical',
        categoryId: '',
        subcategoryId: null,
        productData: initialProductData,
        variations: []
    })
}));
