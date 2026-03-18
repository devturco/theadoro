import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  CheckCircle,
  Truck,
  ShieldCheck,
  Zap,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { GiftOptions } from '@/components/checkout/GiftOptions';
import { GiftOptions as GiftOptionsType, DeliverySchedule as DeliveryScheduleType } from '@/types/order';
import {
  PagarmeTokenizecardForm,
  type PagarmeTokenizecardFormHandle,
} from '@/components/payments/PagarmeTokenizecardForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GiftWrap {
  id: string;
  name: string;
  price: number;
  seller_id: string;
  is_active: boolean;
}
interface SavedAddress {
  id: string;
  label: string | null;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean | null;
}

type CheckoutGateMode = 'required' | 'new-address';

const CUSTOM_ADDRESS_VALUE = 'custom';

import { Button, Input, Label, Separator, Badge, Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theadoro/ui';
import { cn } from '@/lib/utils';
import { couponService } from '@/services/coupon.service';
import { toast as toastSonner } from 'sonner';
import { cepService } from '@/services/cep.service';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  addressLabel: string;
  paymentMethod: 'credit' | 'debit' | 'pix';
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: number;
  isGift: boolean;
  giftMessage: string;
  newsletter: boolean;
  giftOptions: GiftOptionsType;
  deliverySchedule: DeliveryScheduleType;
}

const INITIAL_GIFT_OPTIONS: GiftOptionsType = { is_gift: false };
const INITIAL_DELIVERY_SCHEDULE: DeliveryScheduleType = { scheduled_date: '', scheduled_slot: '' };

const INITIAL_STATE: CheckoutFormData = {
  firstName: '', lastName: '', email: '', phone: '',
  document: '',
  zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  addressLabel: 'Casa',
  paymentMethod: 'credit', cardNumber: '', cardName: '', cardExpiry: '', cardCvv: '', installments: 1,
  isGift: false, giftMessage: '', newsletter: false,
  giftOptions: INITIAL_GIFT_OPTIONS,
  deliverySchedule: INITIAL_DELIVERY_SCHEDULE,
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { processOrder, getShippingQuotes, shippingQuotes, selectedShipping, setSelectedShipping } = useCheckout();
  const { user, profile, refreshProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileAutoFilled, setProfileAutoFilled] = useState(false);
  const [profileGateOpen, setProfileGateOpen] = useState(false);
  const [profileGateSaving, setProfileGateSaving] = useState(false);
  const [profileGateErrors, setProfileGateErrors] = useState<Record<string, string>>({});
  const [profileGateMode, setProfileGateMode] = useState<CheckoutGateMode>('required');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(CUSTOM_ADDRESS_VALUE);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [searchingCep, setSearchingCep] = useState(false);
  const pagarmeTokenizecardRef = useRef<PagarmeTokenizecardFormHandle | null>(null);
  const lastAutoFetchedCepRef = useRef<string | null>(null);
  const lastAutoQuotedCepRef = useRef<string | null>(null);

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const saved = localStorage.getItem('checkoutFormData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) { return INITIAL_STATE; }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    if (profile && !profileAutoFilled) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || profile.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || profile.full_name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || profile.email || '',
        phone: prev.phone || profile.phone || '',
        document: prev.document || (profile as any)?.document || (user?.user_metadata as any)?.cpf || '',
        zipCode: prev.zipCode || profile.postal_code || '',
        street: prev.street || profile.address || '',
        number: prev.number || (profile as any).address_number || '',
        neighborhood: prev.neighborhood || (profile as any).neighborhood || '',
        city: prev.city || profile.city || '',
        state: prev.state || profile.state || '',
      }));
      setProfileAutoFilled(true);
    }
  }, [profile, profileAutoFilled, user]);

  const {
    data: savedAddresses = [],
    isLoading: savedAddressesLoading,
    refetch: refetchSavedAddresses
  } = useQuery({
    queryKey: ['checkout-saved-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_addresses' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SavedAddress[];
    },
    enabled: !!user?.id
  });

  const applySavedAddress = useCallback((address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      addressLabel: address.label || prev.addressLabel || 'Endereco',
      zipCode: address.zip_code || '',
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
    }));
  }, []);

  const documentDigits = useMemo(() => formData.document.replace(/\D/g, ''), [formData.document]);
  const phoneDigits = useMemo(() => formData.phone.replace(/\D/g, ''), [formData.phone]);
  const hasSavedAddress = savedAddresses.length > 0;
  const shouldCollectAddressInGate = profileGateMode === 'new-address' || !hasSavedAddress;

  const profileGateMissingItems = useMemo(() => {
    if (!user) return [];

    const missing: string[] = [];
    if (!formData.firstName.trim() || !formData.lastName.trim()) missing.push('nome completo');
    if (phoneDigits.length < 10) missing.push('whatsapp');
    if (documentDigits.length !== 11 && documentDigits.length !== 14) missing.push('cpf/cnpj');
    if (!hasSavedAddress) missing.push('um endereço salvo');

    return missing;
  }, [documentDigits, formData.firstName, formData.lastName, hasSavedAddress, phoneDigits.length, user]);

  const profileReadyForCheckout = !user || profileGateMissingItems.length === 0;

  useEffect(() => {
    if (!savedAddresses.length) {
      setSelectedAddressId(CUSTOM_ADDRESS_VALUE);
      return;
    }

    const selectedAddress = savedAddresses.find(address => address.id === selectedAddressId);
    if (selectedAddress) return;

    const defaultAddress = savedAddresses.find(address => address.is_default) || savedAddresses[0];
    if (defaultAddress) applySavedAddress(defaultAddress);
  }, [applySavedAddress, savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!user || savedAddressesLoading) return;
    if (!profileReadyForCheckout) {
      setProfileGateMode('required');
      setProfileGateOpen(true);
    }
  }, [profileReadyForCheckout, savedAddressesLoading, user]);

  const { data: giftWraps } = useQuery({
    queryKey: ['gift-wraps', cart.items],
    queryFn: async () => {
      const sellerIds = Array.from(new Set(cart.items.map(item => item.product.seller_id)));
      if (sellerIds.length === 0) return [];
      const { data, error } = await supabase.from('gift_wraps' as any).select('*').eq('is_active', true).in('seller_id', sellerIds);
      if (error) throw error;
      return (data as unknown) as GiftWrap[];
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
      return Math.min(...data.map((p: any) => p.max_installments || 12));
    },
    enabled: cart.items.length > 0
  });

  // Totals
  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = cart.isFreeShippingApplied ? 0 : (selectedShipping?.price || 0);
  const giftWrapPrice = useMemo(() => {
    if (!formData.giftOptions.is_gift || !formData.giftOptions.wrap_style_id || !giftWraps) return 0;
    const wrap = giftWraps.find(w => w.id === formData.giftOptions.wrap_style_id);
    return wrap ? Number(wrap.price) : 0;
  }, [formData.giftOptions.is_gift, formData.giftOptions.wrap_style_id, giftWraps]);

  let discount = 0;
  if (formData.paymentMethod === 'pix') discount = (subtotal + shippingCost + giftWrapPrice) * 0.05;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') discount += (subtotal * appliedCoupon.discountValue) / 100;
    else discount += appliedCoupon.discountValue;
  }

  const total = Math.max(0, subtotal + shippingCost + giftWrapPrice - discount);
  const formatPrice = (p: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);

  const handleInputChange = (field: keyof CheckoutFormData, value: any) => {
    const addressFields: Array<keyof CheckoutFormData> = ['zipCode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state'];

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (profileGateErrors[field]) setProfileGateErrors(prev => ({ ...prev, [field]: '' }));
    if (addressFields.includes(field) && selectedAddressId !== CUSTOM_ADDRESS_VALUE) {
      setSelectedAddressId(CUSTOM_ADDRESS_VALUE);
    }
  };

  const openProfileGate = useCallback((mode: CheckoutGateMode = 'required') => {
    setProfileGateMode(mode);
    setProfileGateErrors({});
    setProfileGateOpen(true);
  }, []);

  const validateProfileGate = useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'Informe seu nome';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Informe seu sobrenome';
    if (!formData.email.trim()) nextErrors.email = 'Informe seu e-mail';
    if (phoneDigits.length < 10) nextErrors.phone = 'Informe um WhatsApp valido';
    if (documentDigits.length !== 11 && documentDigits.length !== 14) nextErrors.document = 'Informe um CPF ou CNPJ valido';

    if (shouldCollectAddressInGate) {
      if (!formData.addressLabel.trim()) nextErrors.addressLabel = 'Dê um nome para este endereço';
      if (!formData.zipCode.trim()) nextErrors.zipCode = 'Informe o CEP';
      if (!formData.street.trim()) nextErrors.street = 'Informe a rua';
      if (!formData.number.trim()) nextErrors.number = 'Informe o numero';
      if (!formData.neighborhood.trim()) nextErrors.neighborhood = 'Informe o bairro';
      if (!formData.city.trim()) nextErrors.city = 'Informe a cidade';
      if (!formData.state.trim()) nextErrors.state = 'Informe a UF';
    }

    setProfileGateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [documentDigits.length, formData.addressLabel, formData.city, formData.email, formData.firstName, formData.lastName, formData.neighborhood, formData.number, formData.state, formData.street, formData.zipCode, phoneDigits.length, shouldCollectAddressInGate]);

  const handleSaveProfileGate = useCallback(async () => {
    if (!user) {
      toastSonner.error('Faça login para salvar seu cadastro antes da compra.');
      return;
    }

    if (!validateProfileGate()) {
      toastSonner.error('Preencha os campos obrigatorios para continuar.');
      return;
    }

    try {
      setProfileGateSaving(true);

      const profilePayload = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
      } as any;

      if (shouldCollectAddressInGate) {
        profilePayload.address = formData.street;
        profilePayload.address_number = formData.number;
        profilePayload.address_complement = formData.complement || '';
        profilePayload.neighborhood = formData.neighborhood || '';
        profilePayload.city = formData.city;
        profilePayload.state = formData.state;
        profilePayload.postal_code = formData.zipCode;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata || {}),
          cpf: documentDigits,
        }
      });

      if (authUpdateError) throw authUpdateError;

      if (shouldCollectAddressInGate) {
        const addressPayload = {
          user_id: user.id,
          label: formData.addressLabel.trim(),
          zip_code: formData.zipCode,
          street: formData.street,
          number: formData.number,
          complement: formData.complement || '',
          neighborhood: formData.neighborhood || '',
          city: formData.city,
          state: formData.state,
          is_default: savedAddresses.length === 0
        };

        const { data: insertedAddress, error: addressError } = await (supabase
          .from('user_addresses' as any)
          .insert(addressPayload)
          .select('*')
          .single() as any);

        if (addressError) throw addressError;

        if (insertedAddress) {
          applySavedAddress(insertedAddress as SavedAddress);
        }
      }

      await Promise.all([refreshProfile(), refetchSavedAddresses()]);
      setProfileGateOpen(false);
      setProfileGateMode('required');
      toastSonner.success(shouldCollectAddressInGate ? 'Cadastro e endereço salvos com sucesso.' : 'Cadastro atualizado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao salvar cadastro no checkout:', error);
      toastSonner.error(error.message || 'Não foi possível salvar seu cadastro agora.');
    } finally {
      setProfileGateSaving(false);
    }
  }, [applySavedAddress, documentDigits, formData.addressLabel, formData.city, formData.complement, formData.firstName, formData.lastName, formData.neighborhood, formData.number, formData.phone, formData.state, formData.street, formData.zipCode, refreshProfile, refetchSavedAddresses, savedAddresses.length, shouldCollectAddressInGate, user, validateProfileGate]);

  useEffect(() => {
    const cleanCep = formData.zipCode.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return;
    }

    if (lastAutoFetchedCepRef.current === cleanCep) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchingCep(true);
        const address = await cepService.lookup(cleanCep);

        lastAutoFetchedCepRef.current = cleanCep;
        setFormData((prev) => ({
          ...prev,
          zipCode: cleanCep.replace(/(\d{5})(\d)/, '$1-$2'),
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        }));

        if (cart.items.length > 0 && lastAutoQuotedCepRef.current !== cleanCep) {
          lastAutoQuotedCepRef.current = cleanCep;
          await getShippingQuotes(cart.items as any[], cleanCep);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toastSonner.error('Não foi possível localizar esse CEP.');
      } finally {
        setSearchingCep(false);
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [cart.items, formData.zipCode, getShippingQuotes]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsProcessing(true);
    try {
      const sellerId = cart.items[0]?.product.seller_id;
      const { data: coupon, error } = await couponService.getByCode(couponCode, sellerId);
      if (error || !coupon) throw new Error('Cupom inválido.');
      setAppliedCoupon({ id: coupon.id, code: coupon.code, discountValue: coupon.discount_value, type: coupon.discount_type });
      toastSonner.success('Cupom aplicado!');
    } catch (err: any) { toastSonner.error(err.message); }
    finally { setIsProcessing(false); }
  };

  const steps = [
    { id: 1, name: 'Identificação', icon: User },
    { id: 2, name: 'Entrega', icon: MapPin },
    { id: 3, name: 'Pagamento', icon: CreditCard },
  ];

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formData.firstName) errs.firstName = 'Obrigatório';
      if (!formData.email) errs.email = 'Obrigatório';
    }
    if (step === 1 && !formData.document.replace(/\D/g, '')) errs.document = 'ObrigatÃ³rio';
    if (step === 2) {
      if (!formData.zipCode) errs.zipCode = 'Obrigatório';
      if (!selectedShipping) toastSonner.error('Selecione uma opção de frete');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0 && (step !== 2 || !!selectedShipping);
  };

  const handleNext = () => {
    if (user && !profileReadyForCheckout) {
      openProfileGate('required');
      toastSonner.error(`Complete seu cadastro para comprar: ${profileGateMissingItems.join(', ')}.`);
      return;
    }

    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
  };
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleFinish = async () => {
    if (user && !profileReadyForCheckout) {
      openProfileGate('required');
      toastSonner.error('Seu cadastro precisa estar completo antes de finalizar a compra.');
      return;
    }

    setIsProcessing(true);
    try {
      const cardToken =
        formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit'
          ? await pagarmeTokenizecardRef.current?.tokenize()
          : undefined;

      const order = await processOrder(cart.items as any, {
        ...formData,
        paymentMethod: formData.paymentMethod === 'credit' ? 'credit_card' : formData.paymentMethod === 'debit' ? 'debit_card' : 'pix',
        address: `${formData.street}, ${formData.number}`,
        country: 'Brasil', // Ensure country is passed
        document: formData.document,
        paymentDetails:
          formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit'
            ? {
                cardNumber: formData.cardNumber,
                cardName: formData.cardName,
                cardExpiry: formData.cardExpiry,
                cardCvv: formData.cardCvv,
                installments: formData.installments,
                cardToken,
              }
            : undefined,
      } as any, cart.isFreeShippingApplied ? {
        price: 0,
        label: 'Frete gratis'
      } : undefined);
      if (order) {
        localStorage.removeItem('checkoutFormData');
        await clearCart();
        navigate(`/order-success/${order.id}`);
      }
    } catch (err: any) { toastSonner.error(err.message); }
    finally { setIsProcessing(false); }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-50 p-8 rounded-full mb-6"><ShoppingCart className="h-12 w-12 text-gray-300" /></div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Adicione produtos ao seu carrinho antes de prosseguir para o checkout.</p>
        <Button onClick={() => navigate('/products')} className="bg-wine rounded-full px-10">Explorar Produtos</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-2 sm:pt-10">
      <PagarmeTokenizecardForm
        ref={pagarmeTokenizecardRef}
        enabled={formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit'}
        holderName={formData.cardName}
        cardNumber={formData.cardNumber}
        cardExpiry={formData.cardExpiry}
        cardCvv={formData.cardCvv}
      />
      <Dialog
        open={profileGateOpen}
        onOpenChange={(open) => {
          if (open) {
            setProfileGateOpen(true);
            return;
          }

          if (profileGateMode === 'new-address' || profileReadyForCheckout) {
            setProfileGateOpen(false);
            setProfileGateMode('required');
            setProfileGateErrors({});
            return;
          }

          setProfileGateOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto rounded-3xl border-gray-100">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-serif font-black text-gray-900">
              {profileGateMode === 'new-address' ? 'Adicionar novo endereço' : 'Complete seu cadastro para comprar'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {profileGateMode === 'new-address'
                ? 'Salve um novo endereço para usar neste pedido e nos próximos.'
                : 'Antes de finalizar a compra, precisamos do seu nome completo, WhatsApp, CPF/CNPJ e pelo menos um endereço salvo.'}
            </DialogDescription>
          </DialogHeader>

          {profileGateMode === 'required' && profileGateMissingItems.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Faltando: <strong>{profileGateMissingItems.join(', ')}</strong>
            </div>
          )}

          <div className="grid gap-5 py-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nome</Label>
              <Input
                value={formData.firstName}
                onChange={(event) => handleInputChange('firstName', event.target.value)}
                className="h-12 rounded-xl bg-gray-50/70"
              />
              {profileGateErrors.firstName && <p className="text-xs font-medium text-red-500">{profileGateErrors.firstName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Sobrenome</Label>
              <Input
                value={formData.lastName}
                onChange={(event) => handleInputChange('lastName', event.target.value)}
                className="h-12 rounded-xl bg-gray-50/70"
              />
              {profileGateErrors.lastName && <p className="text-xs font-medium text-red-500">{profileGateErrors.lastName}</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">E-mail</Label>
              <Input value={formData.email} disabled className="h-12 rounded-xl bg-gray-100 text-gray-500" />
              {profileGateErrors.email && <p className="text-xs font-medium text-red-500">{profileGateErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp</Label>
              <Input
                value={formData.phone}
                onChange={(event) => handleInputChange('phone', event.target.value)}
                className="h-12 rounded-xl bg-gray-50/70"
              />
              {profileGateErrors.phone && <p className="text-xs font-medium text-red-500">{profileGateErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">CPF / CNPJ</Label>
              <Input
                value={formData.document}
                onChange={(event) => handleInputChange('document', event.target.value.replace(/\D/g, '').slice(0, 14))}
                className="h-12 rounded-xl bg-gray-50/70"
                placeholder="Somente numeros"
              />
              {profileGateErrors.document && <p className="text-xs font-medium text-red-500">{profileGateErrors.document}</p>}
            </div>
          </div>

          {shouldCollectAddressInGate ? (
            <div className="space-y-5 rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Endereco salvo</p>
                <p className="mt-1 text-sm text-gray-600">
                  Esse endereço fica disponível para usar nas próximas compras.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nome do endereço</Label>
                <Input
                  value={formData.addressLabel}
                  onChange={(event) => handleInputChange('addressLabel', event.target.value)}
                  className="h-12 rounded-xl bg-white"
                  placeholder="Ex.: Casa, Trabalho, Mae"
                />
                {profileGateErrors.addressLabel && <p className="text-xs font-medium text-red-500">{profileGateErrors.addressLabel}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">CEP</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(event) => handleInputChange('zipCode', event.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'))}
                    className="h-12 rounded-xl bg-white"
                    placeholder="00000-000"
                  />
                  {profileGateErrors.zipCode && <p className="text-xs font-medium text-red-500">{profileGateErrors.zipCode}</p>}
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 w-full rounded-xl bg-white text-gray-700"
                    onClick={() => getShippingQuotes(cart.items as any[], formData.zipCode)}
                    disabled={searchingCep}
                  >
                    {searchingCep ? 'Buscando CEP...' : 'Buscar CEP e frete'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-8">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Rua</Label>
                  <Input value={formData.street} onChange={(event) => handleInputChange('street', event.target.value)} className="h-12 rounded-xl bg-white" />
                  {profileGateErrors.street && <p className="text-xs font-medium text-red-500">{profileGateErrors.street}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Numero</Label>
                  <Input value={formData.number} onChange={(event) => handleInputChange('number', event.target.value)} className="h-12 rounded-xl bg-white" />
                  {profileGateErrors.number && <p className="text-xs font-medium text-red-500">{profileGateErrors.number}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Complemento</Label>
                  <Input value={formData.complement} onChange={(event) => handleInputChange('complement', event.target.value)} className="h-12 rounded-xl bg-white" />
                </div>
                <div className="space-y-1.5 sm:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Bairro</Label>
                  <Input value={formData.neighborhood} onChange={(event) => handleInputChange('neighborhood', event.target.value)} className="h-12 rounded-xl bg-white" />
                  {profileGateErrors.neighborhood && <p className="text-xs font-medium text-red-500">{profileGateErrors.neighborhood}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Cidade</Label>
                  <Input value={formData.city} onChange={(event) => handleInputChange('city', event.target.value)} className="h-12 rounded-xl bg-white" />
                  {profileGateErrors.city && <p className="text-xs font-medium text-red-500">{profileGateErrors.city}</p>}
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">UF</Label>
                  <Input value={formData.state} onChange={(event) => handleInputChange('state', event.target.value.toUpperCase().slice(0, 2))} className="h-12 rounded-xl bg-white" />
                  {profileGateErrors.state && <p className="text-xs font-medium text-red-500">{profileGateErrors.state}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
              Você já possui {savedAddresses.length} endereço(s) salvo(s). Se quiser, pode adicionar outro no passo de entrega.
            </div>
          )}

          <DialogFooter className="gap-3 sm:justify-between">
            {(profileGateMode === 'new-address' || profileReadyForCheckout) ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  setProfileGateOpen(false);
                  setProfileGateMode('required');
                  setProfileGateErrors({});
                }}
              >
                Cancelar
              </Button>
            ) : (
              <div className="text-xs font-semibold text-gray-400">
                Esse cadastro e obrigatorio para seguir com a compra.
              </div>
            )}

            <Button type="button" onClick={handleSaveProfileGate} disabled={profileGateSaving} className="rounded-xl bg-wine px-8">
              {profileGateSaving ? 'Salvando...' : shouldCollectAddressInGate ? 'Salvar cadastro e endereço' : 'Salvar cadastro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header/Logo for Checkout */}
        <div className="flex flex-col items-center mb-8 gap-6">
          <Link to="/" className="text-2xl font-serif font-black text-wine tracking-tighter">THEADORO<span className="text-gray-900">GIFT</span></Link>

          {/* Visual Progress Bar */}
          <div className="w-full max-w-md relative flex justify-between items-center px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
                  currentStep >= step.id ? "bg-wine border-wine text-white scale-110" : "bg-white border-gray-200 text-gray-400"
                )}>
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", currentStep >= step.id ? "text-wine" : "text-gray-400")}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Forms */}
          <div className="lg:col-span-8 space-y-6">

            {currentStep === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-serif font-black text-gray-900 mb-6 flex items-center gap-3">
                  <User className="text-wine h-6 w-6" /> Identificação
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">Nome</Label><Input value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white h-12" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">Sobrenome</Label><Input value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                  <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">E-mail</Label><Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                  <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">WhatsApp / Telefone</Label><Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500 uppercase px-1">CPF / CNPJ</Label>
                    <Input
                      value={formData.document}
                      onChange={e => handleInputChange('document', e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className="rounded-xl bg-gray-50/50 border-gray-100 h-12"
                      placeholder="Somente numeros"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-serif font-black text-gray-900 mb-6 flex items-center gap-3"><MapPin className="text-wine h-6 w-6" /> Entrega</h2>
                  {user && (
                    <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Enderecos salvos</p>
                          <p className="text-sm text-amber-900">
                            Escolha um endereço já salvo ou cadastre outro sem sair do checkout.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-amber-200 bg-white text-amber-900"
                          onClick={() => openProfileGate('new-address')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar endereço
                        </Button>
                      </div>

                      <div className="mt-4">
                        <Select
                          value={selectedAddressId}
                          onValueChange={(value) => {
                            if (value === CUSTOM_ADDRESS_VALUE) {
                              setSelectedAddressId(CUSTOM_ADDRESS_VALUE);
                              return;
                            }

                            const selectedAddress = savedAddresses.find(address => address.id === value);
                            if (selectedAddress) applySavedAddress(selectedAddress);
                          }}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-amber-200 bg-white">
                            <SelectValue placeholder={savedAddressesLoading ? 'Carregando endereços...' : 'Selecione um endereço salvo'} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {savedAddresses.map(address => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.label || 'Endereço'} - {address.street}, {address.number}
                              </SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_ADDRESS_VALUE}>Preencher manualmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!hasSavedAddress && (
                        <p className="mt-3 text-xs font-semibold text-amber-800">
                          Salve pelo menos um endereço para liberar a finalização da compra.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">CEP</Label><Input value={formData.zipCode} onChange={e => handleInputChange('zipCode', e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'))} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" placeholder="00000-000" /></div>
                      <div className="sm:col-span-2 flex items-end"><Button variant="secondary" className="w-full h-12 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => getShippingQuotes(cart.items as any[], formData.zipCode)} disabled={searchingCep}>{searchingCep ? 'Buscando CEP...' : 'Consultar Frete'}</Button></div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-8 sm:col-span-10 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Rua</Label><Input value={formData.street} onChange={e => handleInputChange('street', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                      <div className="col-span-4 sm:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Nº</Label><Input value={formData.number} onChange={e => handleInputChange('number', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-5 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Bairro</Label><Input value={formData.neighborhood} onChange={e => handleInputChange('neighborhood', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                      <div className="sm:col-span-5 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">Cidade</Label><Input value={formData.city} onChange={e => handleInputChange('city', e.target.value)} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                      <div className="sm:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase">UF</Label><Input value={formData.state} onChange={e => handleInputChange('state', e.target.value.toUpperCase().slice(0, 2))} className="rounded-xl bg-gray-50/50 border-gray-100 h-12" /></div>
                    </div>
                  </div>

                  {shippingQuotes.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <Separator className="bg-gray-50" />
                      <Label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Escolha o Frete</Label>
                      <RadioGroup value={selectedShipping?.id as string} onValueChange={(id) => setSelectedShipping(shippingQuotes.find((q: any) => (q.id || q.name) === id) || null)} className="grid gap-3">
                        {shippingQuotes.map((quote: any) => (
                          <label key={quote.id || quote.name} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer", selectedShipping?.id === (quote.id || quote.name) ? "border-wine bg-wine/5 ring-1 ring-wine" : "border-gray-100 bg-white hover:border-gray-200")}>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={quote.id || quote.name} id={quote.id || quote.name} /><div className="space-y-0.5"><p className="font-bold text-sm text-gray-900">{quote.name}</p><p className="text-[10px] text-gray-500 flex items-center gap-1.5"><Truck className="h-3 w-3" /> Chega em {quote.estimated_delivery}</p></div>
                            </div>
                            <span className="font-black text-sm text-wine">{formatPrice(quote.price)}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </div>
                <GiftOptions value={formData.giftOptions} onChange={val => handleInputChange('giftOptions', val)} giftWraps={giftWraps} />
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-serif font-black text-gray-900 mb-6 flex items-center gap-3"><CreditCard className="text-wine h-6 w-6" /> Pagamento</h2>
                <RadioGroup value={formData.paymentMethod} onValueChange={val => handleInputChange('paymentMethod', val)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { id: 'credit', name: 'Cartão', icon: CreditCard, color: 'text-blue-500' },
                    { id: 'pix', name: 'PIX', icon: Zap, color: 'text-teal-500', badge: '-5%' }
                  ].map(method => (
                    <label key={method.id} className={cn("relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3", formData.paymentMethod === method.id ? "border-wine bg-wine/5 shadow-inner" : "border-gray-100 bg-white")}>
                      {method.badge && <span className="absolute -top-2 -right-1 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{method.badge}</span>}
                      <method.icon className={cn("h-6 w-6", method.color)} />
                      <span className="font-bold text-xs uppercase tracking-widest">{method.name}</span>
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                    </label>
                  ))}
                </RadioGroup>

                {formData.paymentMethod === 'credit' && (
                  <div className="space-y-5 py-4 border-t border-gray-50">
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">Nome no Cartão</Label><Input placeholder="Como está impresso no cartão" value={formData.cardName} onChange={e => handleInputChange('cardName', e.target.value)} className="rounded-xl bg-gray-50 h-12" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">Número do Cartão</Label><Input placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={e => handleInputChange('cardNumber', e.target.value)} className="rounded-xl bg-gray-50 h-12" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">Validade</Label><Input placeholder="MM/AA" value={formData.cardExpiry} onChange={e => handleInputChange('cardExpiry', e.target.value)} className="rounded-xl bg-gray-50 h-12" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-gray-500 uppercase px-1">CVV</Label><Input placeholder="000" value={formData.cardCvv} onChange={e => handleInputChange('cardCvv', e.target.value)} className="rounded-xl bg-gray-50 h-12" /></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-500 uppercase px-1">Parcelamento</Label>
                      <Select value={formData.installments.toString()} onValueChange={v => handleInputChange('installments', parseInt(v))}>
                        <SelectTrigger className="rounded-xl bg-gray-50 h-12 border-gray-100"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Array.from({ length: maxInstallmentsLimit }, (_, i) => i + 1).map(n => (
                            <SelectItem key={n} value={n.toString()} className="text-sm font-bold">{n}x de {formatPrice(total / n)} sem juros</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'pix' && (
                  <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                    <div className="flex items-center gap-2 text-teal-700 font-bold"><Zap className="h-4 w-4" /> Pagamento Instantâneo</div>
                    <p className="text-xs text-teal-600/80 leading-relaxed">Ganhe 5% de desconto pagando via PIX. O QR Code será gerado após finalizar o pedido.</p>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Nav Actions */}
            <div className="hidden sm:flex justify-between items-center py-6">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="text-gray-400 font-bold hover:bg-transparent hover:text-gray-900 group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
              </Button>
              {currentStep < 3 ? (
                <Button onClick={handleNext} className="bg-wine hover:bg-wine-dark px-12 h-14 rounded-2xl shadow-xl shadow-wine/20 font-black tracking-widest text-xs">CONTINUAR PARA O PRÓXIMO PASSO</Button>
              ) : (
                <Button onClick={handleFinish} disabled={isProcessing} className="bg-gray-900 hover:bg-black px-12 h-14 rounded-2xl shadow-xl shadow-black/10 font-black tracking-widest text-xs">
                  {isProcessing ? 'PROCESSANDO...' : 'FINALIZAR MEU PEDIDO'}
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-elegant border border-gray-100 sticky top-24">
              <h3 className="text-lg font-serif font-black text-gray-900 mb-6 pb-4 border-b border-gray-50 flex items-center gap-2.5">
                <ShoppingCart className="h-5 w-5 text-gray-300" /> Resumo do Pedido
              </h3>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.product.images?.[0]} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400">{item.quantity}x {formatPrice(item.product.price)}</p>
                    </div>
                    <span className="text-xs font-black text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="my-6 py-5 border-t border-b border-gray-50 border-dashed space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500"><span>Subtotal</span><span className="font-bold text-gray-700">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between items-center text-xs text-gray-500"><span>Frete</span><span className="font-black text-green-600">{shippingCost > 0 ? formatPrice(shippingCost) : 'GRÁTIS'}</span></div>
                {giftWrapPrice > 0 && <div className="flex justify-between items-center text-xs text-gray-500"><span>Embalagem</span><span className="font-bold text-purple-600">{formatPrice(giftWrapPrice)}</span></div>}
                {discount > 0 && <div className="flex justify-between items-center text-xs text-gray-500"><span>Desconto</span><span className="font-black text-green-600">-{formatPrice(discount)}</span></div>}
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Possui um cupom?" value={couponCode} onChange={e => setCouponCode(e.target.value)} disabled={!!appliedCoupon} className="h-10 text-xs rounded-xl bg-gray-50 border-0" />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={isProcessing || !!appliedCoupon} className="h-10 rounded-xl font-bold bg-white text-[10px]">Aplicar</Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 p-2.5 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-600" /><span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{appliedCoupon.code}</span></div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-[10px] text-red-500 font-bold hover:underline">Remover</button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total a pagar</span><span className="text-2xl font-black text-gray-900 leading-none">{formatPrice(total)}</span></div>
                <div className="flex flex-col items-end text-[10px] text-gray-400 font-bold"><div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Compra Segura</div></div>
              </div>
            </div>

            {/* Mobile Nav Sticky Container (Alternative to keep buttons visible) */}
            <div className="sm:hidden fixed bottom-16 left-0 right-0 z-50 px-4 pointer-events-none">
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-floating pointer-events-auto flex gap-2">
                {currentStep > 1 && <Button variant="outline" size="icon" onClick={handleBack} className="h-12 w-12 rounded-xl shrink-0"><ArrowLeft className="h-5 w-5" /></Button>}
                {currentStep < 3 ? (
                  <Button onClick={handleNext} className="flex-1 h-12 bg-wine hover:bg-wine-dark text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-wine/20">Continuar →</Button>
                ) : (
                  <Button onClick={handleFinish} disabled={isProcessing} className="flex-1 h-12 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/20">
                    {isProcessing ? 'Processando..' : 'Finalizar Pedido'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
