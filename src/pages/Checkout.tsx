import React, { useState, useEffect } from 'react';
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
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
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
  paymentMethod: 'credit' | 'debit' | 'pix' | 'boleto';
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: number;
  
  // Options
  saveAddress: boolean;
  isGift: boolean;
  giftMessage: string;
  newsletter: boolean;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, getCartSummary } = useCart();
  const { processOrder, calculateShipping, validateCheckoutData } = useCheckout();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CheckoutFormData>({
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
  });

  const summary = getCartSummary();

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart.items.length, navigate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleInputChange = (field: keyof CheckoutFormData, value: string | number | boolean) => {
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
      const orderData = {
        ...formData,
        items: cart.items,
        summary,
      };

      const order = await processOrder(orderData);
      
      // Redirect to success page
      navigate(`/order-success/${order.id}`);
    } catch (error) {
      console.error('Error processing order:', error);
      setErrors({ general: 'Erro ao processar pedido. Tente novamente.' });
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
    return null; // Will redirect in useEffect
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
                onClick={() => navigate('/cart')}
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
                          <SelectItem value="SP">São Paulo</SelectItem>
                          <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                          <SelectItem value="MG">Minas Gerais</SelectItem>
                          {/* Add more states */}
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
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGift"
                        checked={formData.isGift}
                        onCheckedChange={(checked) => handleInputChange('isGift', checked as boolean)}
                      />
                      <Label htmlFor="isGift" className="text-sm">
                        Este pedido é um presente
                      </Label>
                    </div>
                    
                    {formData.isGift && (
                      <div>
                        <Label htmlFor="giftMessage">Mensagem do presente</Label>
                        <Textarea
                          id="giftMessage"
                          value={formData.giftMessage}
                          onChange={(e) => handleInputChange('giftMessage', e.target.value)}
                          placeholder="Escreva uma mensagem especial..."
                          rows={3}
                        />
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
                      
                      <div className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg">
                        <RadioGroupItem value="boleto" id="boleto" />
                        <Label htmlFor="boleto" className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            <span>Boleto Bancário</span>
                            <Badge variant="secondary">3% desconto</Badge>
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
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
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
                  
                  {formData.paymentMethod === 'boleto' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        O boleto será gerado após a confirmação do pedido.
                        O prazo de vencimento é de 3 dias úteis.
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
                      <p className="text-sm text-gray-600">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.email}<br />
                        {formData.phone}
                      </p>
                    </div>
                    
                    {/* Address Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Endereço de Entrega
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formData.street}, {formData.number}
                        {formData.complement && `, ${formData.complement}`}<br />
                        {formData.neighborhood} - {formData.city}/{formData.state}<br />
                        CEP: {formData.zipCode}
                      </p>
                    </div>
                    
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
                        {formData.paymentMethod === 'boleto' && 'Boleto Bancário'}
                      </p>
                    </div>
                    
                    {formData.isGift && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Presente
                        </h3>
                        <p className="text-sm text-gray-600">
                          Este pedido será enviado como presente.
                          {formData.giftMessage && (
                            <>
                              <br />
                              <strong>Mensagem:</strong> {formData.giftMessage}
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
                        src={item.product.images[0]?.url || '/placeholder-product.jpg'}
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
    </div>
  );
};

export default Checkout;