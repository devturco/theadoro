import { useState, useRef, useEffect } from 'react';
import { Button } from '@theadoro/ui';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@theadoro/ui';
import { Input } from '@theadoro/ui';
import { ScrollArea } from '@theadoro/ui';
import { MessageSquare, X, Send, Sparkles, ShoppingBag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@theadoro/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    products?: any[];
}

export default function TIAdoroAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Sou a tIAdoro, sua assistente virtual de presentes. Como posso ajudar você a encontrar o presente perfeito hoje?',
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        const checkEnabled = async () => {
            try {
                const { data } = await (supabase.from as any)('site_settings')
                    .select('value')
                    .eq('key', 'ai_assistant_enabled')
                    .maybeSingle(); // maybeSingle is safer if it doesn't exist yet

                if (data) {
                    setIsEnabled(Boolean(data.value));
                }
            } catch (e) {
                console.error('Error checking AI status', e);
            }
        };
        checkEnabled();
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Call real AI processing via Edge Function
        try {
            const history = messages.slice(-5).map(msg => ({
                role: msg.sender === 'ai' ? 'assistant' : 'user',
                content: msg.text
            }));

            const { data, error } = await supabase.functions.invoke('ai-gift-assistant', {
                body: { message: inputValue, history }
            });

            if (error) throw error;

            const aiMessage: Message = {
                id: Date.now().toString(),
                text: data.text || 'Desculpe, tive um pequeno problema técnico. Pode repetir?',
                sender: 'ai',
                timestamp: new Date(),
                products: data.products?.length > 0 ? data.products : undefined
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error('AI Error:', err);
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: 'Ops! Meu sistema deu uma piscada aqui. 😅 Pode tentar enviar de novo em alguns instantes?',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const fetchSuggestedProducts = async (term: string) => {
        try {
            // Simple mock fetch or semantic search
            const { data } = await supabase
                .from('products')
                .select('id, name, price, images')
                .limit(3); // Just fetch 3 random products for demo, ideally filter by term
            return data || [];
        } catch (e) {
            return [];
        }
    };

    if (!isEnabled) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end pointer-events-none">
            <div className={cn(
                "transition-all duration-300 transform origin-bottom-right pointer-events-auto",
                isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none h-0 w-0 overflow-hidden"
            )}>
                <Card className="w-[350px] shadow-2xl border-wine/20">
                    <CardHeader className="bg-gradient-to-r from-wine to-wine-light text-white p-4 rounded-t-xl flex flex-row justify-between items-center space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-medium">tIAdoro Assistente</CardTitle>
                                <p className="text-xs text-white/80">Online agora</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                        <Avatar className="h-8 w-8 mt-1">
                                            {msg.sender === 'ai' ? (
                                                <div className="bg-wine h-full w-full flex items-center justify-center text-white text-xs font-bold">IA</div>
                                            ) : (
                                                <AvatarFallback>EH</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="space-y-2">
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm shadow-sm",
                                                msg.sender === 'user'
                                                    ? "bg-wine text-white rounded-tr-none"
                                                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                            {msg.products && (
                                                <div className="space-y-2">
                                                    {msg.products.map(product => (
                                                        <div key={product.id} className="bg-white p-2 rounded-lg border text-xs flex gap-2 items-center hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => window.location.href = `/product/${product.id}`}>
                                                            <img src={product.images?.[0] || '/placeholder.jpg'} className="w-10 h-10 rounded object-cover" alt="" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate">{product.name}</p>
                                                                <p className="text-wine font-bold">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-2 max-w-[85%]">
                                        <Avatar className="h-8 w-8 mt-1">
                                            <div className="bg-wine h-full w-full flex items-center justify-center text-white text-xs font-bold">IA</div>
                                        </Avatar>
                                        <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-gray-800 flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 bg-gray-50 border-t">
                        <form
                            className="flex w-full items-center gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                        >
                            <Input
                                placeholder="Digite sua dúvida..."
                                className="bg-white rounded-full focus-visible:ring-wine"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                            />
                            <Button type="submit" size="icon" className="rounded-full bg-wine hover:bg-wine-dark shrink-0" disabled={!inputValue.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine text-white shadow-[0_10px_24px_-10px_hsl(var(--wine)/0.65)] transition-all hover:scale-105 hover:bg-wine-dark"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
            </Button>
        </div>
    );
}
