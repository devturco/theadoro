import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Truck,
  Gift
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/contexts/CartContext';
import { useCheckout } from '@/hooks/useCheckout';
import { GiftOptions } from '@/components/checkout/GiftOptions';
import { DeliveryScheduler } from '@/components/checkout/DeliveryScheduler';
import { GiftOptions as GiftOptionsType, DeliverySchedule as DeliveryScheduleType, GiftWrap } from '@/types/order';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CheckoutFormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Shipping Address
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;

  // Payment
  paymentMethod: 'credit' | 'debit' | 'pix';
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: number;

  // Options
  isGift: boolean;
  giftMessage: string;
  newsletter: boolean;

  // New complex objects
  giftOptions: GiftOptionsType;
  deliverySchedule: DeliveryScheduleType;

  // Save options
  saveProfile?: boolean;
  saveAddress?: boolean;
  addressLabel?: string;
}

// Initial state helpers
const INITIAL_GIFT_OPTIONS: GiftOptionsType = {
  is_gift: false,
};

const INITIAL_DELIVERY_SCHEDULE: DeliveryScheduleType = {
  scheduled_date: '',
  scheduled_slot: '',
};

const INITIAL_STATE: CheckoutFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  paymentMethod: 'credit',
  cardNumber: '',
  cardName: '',
  cardExpiry: '',
  cardCvv: '',
  installments: 1,
  saveAddress: false,
  isGift: false,
  giftMessage: '',
  newsletter: false,
  giftOptions: INITIAL_GIFT_OPTIONS,
  deliverySchedule: INITIAL_DELIVERY_SCHEDULE,
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const {
    processOrder,
    getShippingQuotes,
    shippingQuotes,
    selectedShipping,
    setSelectedShipping,
    validateCheckoutData
  } = useCheckout();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const saved = localStorage.getItem('checkoutFormData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with INITIAL_STATE to ensure all fields and nested structures exist
        return {
          ...INITIAL_STATE,
          ...parsed,
          giftOptions: { ...INITIAL_STATE.giftOptions, ...(parsed.giftOptions || {}) },
          deliverySchedule: { ...INITIAL_STATE.deliverySchedule, ...(parsed.deliverySchedule || {}) }
        };
      } catch (e) {
        console.error('Error parsing saved form data', e);
      }
    }
    return INITIAL_STATE;
  });

  const { profile } = useAuth();
  const [profileAutoFilled, setProfileAutoFilled] = useState(false);

  const { data: giftWraps } = useQuery({
    queryKey: ['gift-wraps', cart.items],
    queryFn: async () => {
      // Get distinct seller IDs from cart items
      const sellerIds = Array.from(new Set(cart.items.map(item => item.product.seller_id)));

      if (sellerIds.length === 0) return [];

      const { data, error } = await supabase
        .from('gift_wraps' as any)
        .select('*')
        .eq('is_active', true)
        .in('seller_id', sellerIds);

      if (error) {
        console.error('Error fetching gift wraps:', error);
        throw error;
      }

      return (data as any) as GiftWrap[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: cart.items.length > 0 // Only fetch if cart has items
  });

  const { data: maxInstallments = 12 } = useQuery({
    queryKey: ['max-installments', cart.items],
    queryFn: async () => {
      const sellerIds = Array.from(new Set(cart.items.map(item => item.product.seller_id)));
      if (sellerIds.length === 0) return 12;

      const { data, error } = await supabase
        .from('profiles')
        .select('max_installments')
        .in('id', sellerIds);

      if (error) {
        console.error('Error fetching max installments:', error);
        return 12;
      }

      if (!data || data.length === 0) return 12;

      // Find the minimum limit among all sellers in cart to ensure all allow it
      const limits = data.map((p: any) => p.max_installments || 12);
      return Math.min(...limits);
    },
    enabled: cart.items.length > 0
  });

  // Auto-fill from profile if logged in and data is empty
  useEffect(() => {
    if (profile && !profileAutoFilled) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || profile.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || profile.full_name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
        zipCode: prev.zipCode || profile.postal_code || '',
        street: prev.street || profile.address || '',
        number: prev.number || (profile as any).address_number || '',
        complement: prev.complement || (profile as any).address_complement || '',
        neighborhood: prev.neighborhood || (profile as any).neighborhood || '',
        city: prev.city || profile.city || '',
        state: prev.state || profile.state || '',
      }));
      setProfileAutoFilled(true);
    }
  }, [profile, profileAutoFilled]);


  // Calculate summary derived from cart items
  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = selectedShipping?.price || 0;

  // Find selected gift wrap price from fetched data
  const giftWrapPrice = useMemo(() => {
    if (!formData.giftOptions.is_gift || !formData.giftOptions.wrap_style_id || !giftWraps) return 0;
    const wrap = giftWraps.find(w => w.id === formData.giftOptions.wrap_style_id);
    return wrap ? Number(wrap.price) : 0;
  }, [formData.giftOptions.is_gift, formData.giftOptions.wrap_style_id, giftWraps]);

  let discount = 0;
  if (formData.paymentMethod === 'pix') {
    discount = (subtotal + shippingCost + giftWrapPrice) * 0.05;

  }

  const total = subtotal + shippingCost + giftWrapPrice - discount;

  const summary = {
    subtotal,
    shipping: shippingCost,
    giftWrap: giftWrapPrice,
    discount,
    total
  };



  // Save state to localStorage changes
  useEffect(() => {
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('checkoutStep', currentStep.toString());
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart.items.length, navigate]);


  // CEP Autofill
  useEffect(() => {
    const cep = formData.zipCode.replace(/\D/g, '');

    if (cep.length === 8) {
      setIsProcessing(true); // Using existing loading state or maybe could use a local one to just show indicator
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              street: data.logradouro,
              neighborhood: data.bairro,
              city: data.localidade,
              state: data.uf,
              complement: data.complemento || prev.complement, // Keep existing if user typed or just overwrite? usually overwrite or use data.complemento if exists
            }));
            // Clear errors for these fields if any
            setErrors(prev => ({
              ...prev,
              street: '',
              neighborhood: '',
              city: '',
              state: '',
              zipCode: ''
            }));
          } else {
            setErrors(prev => ({ ...prev, zipCode: 'CEP não encontrado' }));
          }
        })
        .catch(() => {
          setErrors(prev => ({ ...prev, zipCode: 'Erro ao buscar CEP' }));
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [formData.zipCode]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Personal Info
      if (!formData.firstName.trim()) newErrors.firstName = 'Nome é obrigatório';
      if (!formData.lastName.trim()) newErrors.lastName = 'Sobrenome é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    }

    if (step === 2) {
      // Shipping Address
      if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';
      if (!formData.street.trim()) newErrors.street = 'Endereço é obrigatório';
      if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    }

    if (step === 3) {
      // Payment
      if (formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit') {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Número do cartão é obrigatório';
        if (!formData.cardName.trim()) newErrors.cardName = 'Nome no cartão é obrigatório';
        if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Validade é obrigatória';
        if (!formData.cardCvv.trim()) newErrors.cardCvv = 'CVV é obrigatório';
      }

      // Validate Gift Options if Gift is selected (Gift options are in step 3)
      if (formData.giftOptions.is_gift) {
        if (!formData.giftOptions.wrap_style_id) newErrors.giftWrap = 'Escolha uma embalagem';
        if (!formData.giftOptions.recipient_name) newErrors.recipientName = 'Informe o nome do destinatário';
        if (!formData.giftOptions.sender_name) newErrors.senderName = 'Informe seu nome (De)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitOrder = async () => {
    if (!validateStep(3)) return;

    setIsProcessing(true);
    try {
      const orderItems = cart.items.map(item => ({
        ...item,
        addedAt: new Date().toISOString(),
      }));

      // Map payment method values
      const paymentMethodMap: Record<string, 'credit_card' | 'debit_card' | 'pix' | 'boleto'> = {
        'credit': 'credit_card',
        'debit': 'debit_card',
        'pix': 'pix',
      };

      // Construct CheckoutData expected by useCheckout
      const checkoutData = {
        ...formData,
        paymentMethod: paymentMethodMap[formData.paymentMethod],
        address: `${formData.street}, ${formData.number}`,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'Brasil',
        paymentDetails: {
          cardNumber: formData.cardNumber,
          cardName: formData.cardName,
          cardExpiry: formData.cardExpiry,
          cardCvv: formData.cardCvv,
          installments: formData.installments
        }
      };

      // Pass items and mapped data
      const order = await processOrder(orderItems as any, checkoutData);

      if (order) {
        // Clear checkout state from localStorage
        localStorage.removeItem('checkoutFormData');
        localStorage.removeItem('checkoutStep');

        // Clear the shopping cart
        await clearCart();

        // Redirect to success page
        navigate(`/order-success/${order.id}`);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pedido. Tente novamente.';
      setErrors({ general: errorMessage });
      // Suggestion: toast error here if toast is available in component
      alert(errorMessage); // Temporary fallback for visibility
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Endereço', icon: MapPin },
    { number: 3, title: 'Pagamento', icon: CreditCard },
    { number: 4, title: 'Confirmação', icon: CheckCircle },
  ];

  if (cart.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep(prev => prev - 1);
                  } else {
                    navigate('/cart');
                  }
                }}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Finalizar Compra
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Passo {currentStep} de {steps.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2',
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="ml-3 hidden sm:block">
                    <p className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    )}>
                      {step.title}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-4',
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Dados Pessoais
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveProfile"
                      checked={formData.saveProfile}
                      onCheckedChange={(checked) => handleInputChange('saveProfile', checked as boolean)}
                    />
                    <Label htmlFor="saveProfile" className="text-sm">
                      Salvar meus dados no perfil
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) => handleInputChange('newsletter', checked as boolean)}
                    />
                    <Label htmlFor="newsletter" className="text-sm">
                      Quero receber ofertas e novidades por e-mail
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Endereço de Entrega
                  </h2>

                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="00000-000"
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Endereço *</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className={errors.street ? 'border-red-500' : ''}
                      />
                      {errors.street && (
                        <p className="text-sm text-red-600 mt-1">{errors.street}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className={errors.number ? 'border-red-500' : ''}
                      />
                      {errors.number && (
                        <p className="text-sm text-red-600 mt-1">{errors.number}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      placeholder="Apartamento, bloco, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className={errors.neighborhood ? 'border-red-500' : ''}
                      />
                      {errors.neighborhood && (
                        <p className="text-sm text-red-600 mt-1">{errors.neighborhood}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && (
                        <p className="text-sm text-red-600 mt-1">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAddress"
                        checked={formData.saveAddress}
                        onCheckedChange={(checked) => handleInputChange('saveAddress', checked as boolean)}
                      />
                      <Label htmlFor="saveAddress" className="text-sm">
                        Salvar este endereço para futuras compras
                      </Label>
                    </div>

                    {formData.saveAddress && (
                      <div>
                        <Label htmlFor="addressLabel">Nome do Endereço</Label>
                        <Input
                          id="addressLabel"
                          value={formData.addressLabel || ''}
                          onChange={(e) => handleInputChange('addressLabel', e.target.value)}
                          placeholder="Ex: Casa, Trabalho"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <DeliveryScheduler
                    value={formData.deliverySchedule}
                    onChange={(val) => handleInputChange('deliverySchedule', val)}
                  />

                  {/* Shipping Options */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Opções de Frete</h3>
                      <button
                        onClick={() => getShippingQuotes(cart.items as any[], formData.zipCode)}
                        type="button" // Prevent form submission
                        className="text-sm text-primary hover:underline"
                      >
                        Calcular Frete
                      </button>
                    </div>

                    {shippingQuotes.length > 0 ? (
                      <RadioGroup
                        value={selectedShipping?.service_id.toString()}
                        onValueChange={(val) => {
                          const selected = shippingQuotes.find(q => q.service_id.toString() === val);
                          if (selected) setSelectedShipping(selected);
                        }}
                      >
                        <div className="space-y-3">
                          {shippingQuotes.map((quote) => (
                            <div key={quote.service_id} className="flex items-center justify-between space-x-2 p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={quote.service_id.toString()} id={`shipping-${quote.service_id}`} />
                                <Label htmlFor={`shipping-${quote.service_id}`} className="flex flex-col">
                                  <span className="font-medium">{quote.name}</span>
                                  <span className="text-sm text-gray-500">Chega em {quote.estimated_delivery}</span>
                                </Label>
                              </div>
                              <span className="font-semibold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        Informe o CEP e clique em Calcular Frete para ver as opções.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Forma de Pagamento
                  </h2>

                  {/* Gift Options Section */}
                  <div className="mb-8">
                    <GiftOptions
                      value={formData.giftOptions}
                      onChange={(val) => handleInputChange('giftOptions', val)}
                      giftWraps={giftWraps}
                    />
                  </div>

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Cartão de Crédito</span>
                            <Badge variant="secondary">Até 12x</Badge>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Cartão de Débito</span>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <span>PIX</span>
                            <Badge variant="secondary">5% desconto</Badge>
                          </div>
                        </Label>
                      </div>


                    </div>
                  </RadioGroup>

                  {(formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit') && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Dados do Cartão</h3>

                      <div>
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          className={errors.cardNumber ? 'border-red-500' : ''}
                        />
                        {errors.cardNumber && (
                          <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="cardName">Nome no Cartão *</Label>
                        <Input
                          id="cardName"
                          value={formData.cardName}
                          onChange={(e) => handleInputChange('cardName', e.target.value)}
                          placeholder="Como está escrito no cartão"
                          className={errors.cardName ? 'border-red-500' : ''}
                        />
                        {errors.cardName && (
                          <p className="text-sm text-red-600 mt-1">{errors.cardName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                            placeholder="MM/AA"
                            className={errors.cardExpiry ? 'border-red-500' : ''}
                          />
                          {errors.cardExpiry && (
                            <p className="text-sm text-red-600 mt-1">{errors.cardExpiry}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            value={formData.cardCvv}
                            onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                            placeholder="000"
                            className={errors.cardCvv ? 'border-red-500' : ''}
                          />
                          {errors.cardCvv && (
                            <p className="text-sm text-red-600 mt-1">{errors.cardCvv}</p>
                          )}
                        </div>
                      </div>

                      {formData.paymentMethod === 'credit' && (
                        <div>
                          <Label htmlFor="installments">Parcelas</Label>
                          <Select
                            value={formData.installments.toString()}
                            onValueChange={(value) => handleInputChange('installments', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}x de {formatPrice(summary.total / num)}
                                  {num === 1 ? ' à vista' : ` (Total: ${formatPrice(summary.total)})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.paymentMethod === 'pix' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Após confirmar o pedido, você receberá o código PIX para pagamento.
                        O pedido será processado após a confirmação do pagamento.
                      </AlertDescription>
                    </Alert>
                  )}


                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Confirmar Pedido
                  </h2>

                  <div className="space-y-4">
                    {/* Personal Info Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Dados Pessoais</h3>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">
                          {formData.firstName || '(Nome não informado)'} {formData.lastName || ''}
                        </p>
                        <p>{formData.email || '(E-mail não informado)'}</p>
                        <p>{formData.phone || '(Telefone não informado)'}</p>
                      </div>
                    </div>

                    {/* Address Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Endereço de Entrega
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>
                          {formData.street ? (
                            <>
                              {formData.street}, {formData.number}
                              {formData.complement && `, ${formData.complement}`}
                            </>
                          ) : (
                            <span className="text-red-500 italic">Endereço não informado / incompleto</span>
                          )}
                        </p>
                        {formData.neighborhood && (
                          <p>{formData.neighborhood} - {formData.city}/{formData.state}</p>
                        )}
                        <p>CEP: {formData.zipCode || '(Não informado)'}</p>
                      </div>
                    </div>

                    {/* Delivery Schedule Summary */}
                    {(formData.deliverySchedule.scheduled_date || selectedShipping) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Entrega e Agendamento
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          {selectedShipping && (
                            <div className="pb-2 border-b border-gray-100">
                              <p className="font-medium text-gray-900">
                                Método: <span className="text-blue-600">{selectedShipping.name}</span>
                              </p>
                              <p className="text-xs">Prazo: {selectedShipping.delivery_days} dias úteis</p>
                            </div>
                          )}
                          {formData.deliverySchedule.scheduled_date && (
                            <p>
                              Data Agendada: {new Date(formData.deliverySchedule.scheduled_date).toLocaleDateString('pt-BR')}<br />
                              Período: {formData.deliverySchedule.scheduled_slot === 'morning' ? 'Manhã' :
                                formData.deliverySchedule.scheduled_slot === 'afternoon' ? 'Tarde' : 'Horário Comercial'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Forma de Pagamento
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formData.paymentMethod === 'credit' && `Cartão de Crédito - ${formData.installments}x`}
                        {formData.paymentMethod === 'debit' && 'Cartão de Débito'}
                        {formData.paymentMethod === 'pix' && 'PIX'}

                      </p>
                    </div>

                    {(formData.isGift || formData.giftOptions.is_gift) && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Presente
                        </h3>
                        <p className="text-sm text-gray-600">
                          Este pedido será enviado como presente.
                          {(formData.giftMessage || formData.giftOptions.message) && (
                            <>
                              <br />
                              <strong>Mensagem:</strong> {formData.giftMessage || formData.giftOptions.message}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>


                  {errors.general && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">
                        {errors.general}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  Voltar
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={handleNextStep}>
                    Continuar
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Resumo do Pedido
                </h3>

                {/* Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product.images[0] || '/placeholder-product.jpg'}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qtd: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(summary.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className={cn(
                      'font-medium',
                      summary.shipping === 0 ? 'text-green-600' : 'text-gray-900'
                    )}>
                      {summary.shipping === 0 ? 'Grátis' : formatPrice(summary.shipping)}
                    </span>
                  </div>

                  {summary.giftWrap > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium flex items-center gap-1">
                        <Gift className="h-3 w-3 text-purple-600" />
                        Embalagem de Presente
                      </span>
                      <span className="font-medium">{formatPrice(summary.giftWrap)}</span>
                    </div>
                  )}

                  {summary.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto</span>
                      <span className="font-medium text-green-600">
                        -{formatPrice(summary.discount)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(summary.total)}
                    </span>
                  </div>
                </div>

                {/* Security Info */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Lock className="h-3 w-3" />
                    <span>Compra 100% segura e protegida</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>↩️</span>
                    <span>7 dias para devolução</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Checkout;