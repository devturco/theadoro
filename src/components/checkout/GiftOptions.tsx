import React from 'react';
import { Gift, MessageSquare, User } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GIFT_WRAPS } from '@/data/giftWraps';
import { GiftOptions as GiftOptionsType } from '@/types/order';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface GiftOptionsProps {
    value: GiftOptionsType;
    onChange: (value: GiftOptionsType) => void;
}

export const GiftOptions: React.FC<GiftOptionsProps> = ({ value, onChange }) => {
    const handleToggleGift = (checked: boolean) => {
        onChange({ ...value, is_gift: checked });
    };

    const handleChange = (field: keyof GiftOptionsType, fieldValue: any) => {
        onChange({ ...value, [field]: fieldValue });
    };

    if (!value.is_gift) {
        return (
            <div className="flex items-center space-x-2 p-4 bg-white rounded-lg border border-gray-200">
                <Checkbox
                    id="isGift"
                    checked={value.is_gift}
                    onCheckedChange={handleToggleGift}
                />
                <Label htmlFor="isGift" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Gift className="h-4 w-4 text-purple-600" />
                    Este pedido é um presente?
                </Label>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Opções de Presente</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isGiftActive"
                        checked={value.is_gift}
                        onCheckedChange={handleToggleGift}
                    />
                    <Label htmlFor="isGiftActive" className="text-sm">
                        Sim, é para presente
                    </Label>
                </div>
            </div>

            {/* Gift Wraps Carousel */}
            <div className="space-y-3">
                <Label className="text-base">Escolha a Embalagem</Label>
                <Carousel
                    opts={{ align: "start" }}
                    className="w-full max-w-sm mx-auto sm:max-w-xl md:max-w-2xl"
                >
                    <CarouselContent>
                        {GIFT_WRAPS.map((wrap) => (
                            <CarouselItem key={wrap.id} className="md:basis-1/2 lg:basis-1/3">
                                <div
                                    className={cn(
                                        "p-1 cursor-pointer transition-all",
                                        value.wrap_style_id === wrap.id ? "ring-2 ring-purple-600 rounded-xl" : ""
                                    )}
                                    onClick={() => handleChange('wrap_style_id', wrap.id)}
                                >
                                    <Card>
                                        <CardContent className="flex flex-col items-center p-4 gap-3">
                                            <div className="relative w-full aspect-square rounded-md overflow-hidden">
                                                <img
                                                    src={wrap.image_url}
                                                    alt={wrap.name}
                                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <h4 className="font-medium text-sm line-clamp-1">{wrap.name}</h4>
                                                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                                                    {wrap.price > 0 ? `R$ ${wrap.price.toFixed(2)}` : 'Grátis'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>

            {/* Message & Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <Label>Mensagem Personalizada</Label>
                    </div>
                    <div className="space-y-3">
                        <Textarea
                            value={value.message || ''}
                            onChange={(e) => handleChange('message', e.target.value)}
                            placeholder="Escreva algo especial..."
                            className="resize-none min-h-[120px]"
                            maxLength={300}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>A mensagem será impressa num cartão.</span>
                            <span>{value.message?.length || 0}/300</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <Label>Para quem é?</Label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="recipient_name" className="text-xs text-gray-500 mb-1 block">Nome do Destinatário (Para)</Label>
                            <Input
                                id="recipient_name"
                                value={value.recipient_name || ''}
                                onChange={(e) => handleChange('recipient_name', e.target.value)}
                                placeholder="Ex: Maria Silva"
                            />
                        </div>

                        <div>
                            <Label htmlFor="sender_name" className="text-xs text-gray-500 mb-1 block">Seu Nome (De)</Label>
                            <Input
                                id="sender_name"
                                value={value.sender_name || ''}
                                onChange={(e) => handleChange('sender_name', e.target.value)}
                                placeholder="Ex: João Souza"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-gray-500 mb-2 block">Notificar Destinatário?</Label>
                            <RadioGroup
                                value={value.notification_type || 'physical_card'}
                                onValueChange={(val) => handleChange('notification_type', val)}
                                className="flex flex-col space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="physical_card" id="physical" />
                                    <Label htmlFor="physical" className="text-sm font-normal">Apenas cartão físico (Surpresa)</Label>
                                </div>
                                {/* 
                 <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed" title="Em breve">
                   <RadioGroupItem value="digital_whatsapp" id="whatsapp" disabled />
                   <Label htmlFor="whatsapp" className="text-sm font-normal">Enviar também por WhatsApp (Em breve)</Label>
                 </div>
                 */}
                            </RadioGroup>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
