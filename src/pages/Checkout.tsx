
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
  Gift,
  ChevronDown
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
import { couponService } from '@/services/coupon.service';
import { toast as toastSonner } from 'sonner';

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
      const sellerIds = Array.from(new Set(cart.items.map(item => item.product.seller_id)));
      if (sellerIds.length === 0) return [];
      const { data, error } = await supabase.from('gift_wraps' as any).select('*').eq('is_active', true).in('seller_id', sellerIds);
      if (error) throw error;
      return (data as any) as GiftWrap[];
    },
    enabled: cart.items.length > 0
  });

  const { data: maxInstallmentsLimit = 12 } = useQuery({
    queryKey: ['max-installments', cart.items],
    queryFn: async () => {
      const sellerIds = Array.from(new Set(cart.items.map(item => item.product.seller_id)));
      if (sellerIds.length === 0) return 12;
      const { data, error } = await supabase.from('profiles').select('max_installments').in('id', sellerIds);
      if (error) return 12;
      if (!data || data.length === 0) return 12;
      const limits = data.map((p: any) => p.max_installments || 12);
      return Math.min(...limits);
    },
    enabled: cart.items.length > 0
  });

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

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsProcessing(true);
    
    try {
      // Find seller from cart to check for specialized coupons
      const sellerId = cart.items[0]?.product.seller_id;
      const { data: coupon, error } = await couponService.getByCode(couponCode, sellerId);

      if (error || !coupon) throw new Error('Cupom inválido ou não encontrado.');
      if (!coupon.is_active) throw new Error('Este cupom não está mais ativo.');
      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) throw new Error('Este cupom expirou.');
      if (subtotal < (coupon.min_purchase || 0)) throw new Error(`O valor mínimo para este cupom é R$ ${Number(coupon.min_purchase).toFixed(2)}`);

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discountValue: coupon.discount_value,
        type: coupon.discount_type
      });

      toastSonner.success('Cupom aplicado com sucesso!');
    } catch (err: any) {
      toastSonner.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-select shipping
  useEffect(() => {
    if (cart.selectedShipping && shippingQuotes.length > 0) {
      const match = shippingQuotes.find(q => q.id === cart.selectedShipping?.id);
      if (match && (!selectedShipping || selectedShipping.id !== match.id)) {
        setSelectedShipping(match);
      }
    }
  }, [cart.selectedShipping, shippingQuotes, selectedShipping, setSelectedShipping]);

  // Totals Calculation
  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = selectedShipping?.price || cart.selectedShipping?.price || 0;
  const giftWrapPrice = useMemo(() => {
    if (!formData.giftOptions.is_gift || !formData.giftOptions.wrap_style_id || !giftWraps) return 0;
    const wrap = giftWraps.find(w => w.id === formData.giftOptions.wrap_style_id);
    return wrap ? Number(wrap.price) : 0;
  }, [formData.giftOptions.is_gift, formData.giftOptions.wrap_style_id, giftWraps]);

  let discount = 0;
  if (formData.paymentMethod === 'pix') {
    discount = (subtotal + shippingCost + giftWrapPrice) * 0.05;
  }
  
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount += (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discount += appliedCoupon.discountValue;
    }
  }

  const total = Math.max(0, subtotal + shippingCost + giftWrapPrice - discount);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Nome é obrigatório';
      if (!formData.lastName.trim()) newErrors.lastName = 'Sobrenome é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    }
    if (step === 2) {
      if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';
      if (!formData.street.trim()) newErrors.street = 'Endereço é obrigatório';
      if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    }
    if (step === 3) {
      if (formData.paymentMethod !== 'pix') {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Número do cartão é obrigatório';
        if (!formData.cardName.trim()) newErrors.cardName = 'Nome no cartão é obrigatório';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => { if (validateStep(currentStep)) setCurrentStep(prev => prev + 1); };
  const handlePrevStep = () => { setCurrentStep(prev => prev - 1); };

  const handleSubmitOrder = async () => {
    if (!validateStep(3)) return;
    setIsProcessing(true);
    try {
      const checkoutData = {
        ...formData,
        paymentMethod: formData.paymentMethod === 'credit' ? 'credit_card' : formData.paymentMethod === 'debit' ? 'debit_card' : 'pix',
        address: `${formData.street}, ${formData.number}`,
        paymentDetails: {
          cardNumber: formData.cardNumber,
          cardName: formData.cardName,
          cardExpiry: formData.cardExpiry,
          cardCvv: formData.cardCvv,
          installments: formData.installments
        }
      };
      const order = await processOrder(cart.items as any, checkoutData as any);
      if (order) {
        localStorage.removeItem('checkoutFormData');
        await clearCart();
        navigate(`/order-success/${order.id}`);
      }
    } catch (error: any) {
      toastSonner.error(error.message || 'Erro ao processar pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => currentStep > 1 ? handlePrevStep() : navigate('/cart')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
          <div className="text-sm font-medium text-gray-500">Passo {currentStep} de 4</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} /></div>
                <div className="space-y-2"><Label>Sobrenome</Label><Input value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2"><Label>E-mail</Label><Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} /></div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Shipping */}
          {currentStep === 2 && (
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>Endereço de Entrega</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>CEP</Label><Input value={formData.zipCode} onChange={e => handleInputChange('zipCode', e.target.value)} /></div>
                  <div className="space-y-2 flex items-end"><Button variant="outline" className="w-full" onClick={() => getShippingQuotes(cart.items as any[], formData.zipCode)}>Calcular Frete</Button></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2"><Label>Rua</Label><Input value={formData.street} onChange={e => handleInputChange('street', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nº</Label><Input value={formData.number} onChange={e => handleInputChange('number', e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={formData.neighborhood} onChange={e => handleInputChange('neighborhood', e.target.value)} /></div>
                
                {shippingQuotes.length > 0 && (
                  <div className="pt-4 space-y-3">
                    <Label className="text-base font-bold">Opções de Frete</Label>
                    <RadioGroup value={selectedShipping?.id} onValueChange={(id) => setSelectedShipping(shippingQuotes.find(q => q.id === id) || null)}>
                      {shippingQuotes.map(quote => (
                        <div key={quote.id} className={cn("flex items-center justify-between p-4 border rounded-xl transition-all cursor-pointer", selectedShipping?.id === quote.id ? "border-wine bg-wine/5 shadow-sm" : "border-gray-100 bg-white")}>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={quote.id} id={quote.id} />
                            <Label htmlFor={quote.id} className="cursor-pointer">
                              <p className="font-bold text-gray-900">{quote.name}</p>
                              <p className="text-xs text-gray-500">Entrega em {quote.estimated_delivery}</p>
                            </Label>
                          </div>
                          <span className="font-bold text-wine">{formatPrice(quote.price)}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment & Gifts */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <GiftOptions value={formData.giftOptions} onChange={val => handleInputChange('giftOptions', val)} giftWraps={giftWraps} />
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={formData.paymentMethod} onValueChange={val => handleInputChange('paymentMethod', val)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['credit', 'pix'].map(method => (
                        <div key={method} className={cn("p-4 border rounded-xl cursor-pointer transition-all", formData.paymentMethod === method ? "border-wine bg-wine/5" : "border-gray-100")}>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={method} id={method} />
                            <Label htmlFor={method} className="font-bold capitalize cursor-pointer">{method === 'credit' ? 'Cartão' : method}</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === 'credit' && (
                    <div className="space-y-4 pt-4 animate-in fade-in duration-300">
                      <div className="space-y-2"><Label>Número do Cartão</Label><Input placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={e => handleInputChange('cardNumber', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Validade</Label><Input placeholder="MM/AA" value={formData.cardExpiry} onChange={e => handleInputChange('cardExpiry', e.target.value)} /></div>
                        <div className="space-y-2"><Label>CVV</Label><Input placeholder="000" value={formData.cardCvv} onChange={e => handleInputChange('cardCvv', e.target.value)} /></div>
                      </div>
                      <div className="space-y-2">
                        <Label>Parcelamento</Label>
                        <Select value={formData.installments.toString()} onValueChange={v => handleInputChange('installments', parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({length: maxInstallmentsLimit}, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}x de {formatPrice(total / n)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handlePrevStep} disabled={currentStep === 1}>Voltar</Button>
            {currentStep < 4 ? (
              <Button className="bg-wine hover:bg-wine-dark px-10" onClick={handleNextStep}>Continuar</Button>
            ) : (
              <Button className="bg-green-600 hover:bg-green-700 px-10" onClick={handleSubmitOrder} disabled={isProcessing}>
                {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg sticky top-24">
            <CardHeader><CardTitle className="text-lg">Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="flex-1">
                    <p className="font-bold line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.product.price)}</p>
                  </div>
                  <span className="font-bold">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              
              <Separator />
              
              {/* Real Coupon Section */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Cupom de Desconto</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Código" 
                    className="h-9 text-xs" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon} 
                  />
                  <Button variant="outline" size="sm" className="h-9" onClick={handleApplyCoupon} disabled={isProcessing || !!appliedCoupon}>Aplicar</Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-100">
                    <span className="text-xs font-bold text-green-700">{appliedCoupon.code} aplicado!</span>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-[10px] text-green-600 underline">Remover</button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Frete</span><span className="text-green-600 font-bold">{shippingCost > 0 ? formatPrice(shippingCost) : 'Grátis'}</span></div>
                {giftWrapPrice > 0 && <div className="flex justify-between text-purple-600 font-medium"><span>Embalagem</span><span>{formatPrice(giftWrapPrice)}</span></div>}
                {discount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Desconto</span><span>-{formatPrice(discount)}</span></div>}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-black text-gray-900"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
