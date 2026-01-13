import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DeliverySchedule } from '@/types/order';
import { format, addBusinessDays, isWeekend, isBefore, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeliverySchedulerProps {
    value: DeliverySchedule | undefined;
    onChange: (value: DeliverySchedule) => void;
}

const SLOTS = [
    { id: 'morning', label: 'Manhã', time: '08:00 - 12:00' },
    { id: 'afternoon', label: 'Tarde', time: '13:00 - 18:00' },
    { id: 'commercial', label: 'Horário Comercial', time: '08:00 - 18:00' },
];

export const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({ value, onChange }) => {
    const today = startOfToday();
    const date = value?.scheduled_date ? new Date(value.scheduled_date) : undefined;

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return;
        onChange({
            scheduled_date: newDate.toISOString(),
            scheduled_slot: value?.scheduled_slot || 'commercial',
        });
    };

    const handleSlotSelect = (slotId: string) => {
        if (!date) return;
        onChange({
            scheduled_date: date.toISOString(),
            scheduled_slot: slotId,
        });
    };

    // Disable past dates and weekends (optional, depending on business logic)
    const isDateDisabled = (date: Date) => {
        return isBefore(date, today) || isWeekend(date);
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Agendamento de Entrega</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Date Selection */}
                <div className="space-y-3">
                    <Label>Data da Entrega</Label>
                    <div className="border rounded-md p-1 bg-white inline-block">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            disabled={isDateDisabled}
                            initialFocus
                            locale={ptBR}
                            className="rounded-md border-0"
                        />
                    </div>
                    {date && (
                        <p className="text-sm text-green-600 font-medium">
                            Agendado para: {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    )}
                </div>

                {/* Slot Selection */}
                <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Período de Entrega
                    </Label>

                    <RadioGroup
                        value={value?.scheduled_slot}
                        onValueChange={handleSlotSelect}
                        className="grid gap-3"
                        disabled={!date}
                    >
                        {SLOTS.map((slot) => (
                            <div key={slot.id}>
                                <RadioGroupItem value={slot.id} id={slot.id} className="peer sr-only" />
                                <Label
                                    htmlFor={slot.id}
                                    className={cn(
                                        "flex flex-col border-2 border-gray-100 bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-200 transition-all",
                                        "peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50",
                                        !date && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span className="font-semibold text-gray-900">{slot.label}</span>
                                    <span className="text-sm text-gray-500">{slot.time}</span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {!date && (
                        <p className="text-xs text-orange-500">Selecione uma data primeiro.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
