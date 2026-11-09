-- Create table for subscription invoices/payments history
CREATE TABLE IF NOT EXISTS public.seller_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    subscription_id UUID REFERENCES public.seller_subscriptions(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
    payment_method TEXT, -- pix, credit_card, boleto
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    invoice_url TEXT, -- URL to PDF invoice if generated
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.seller_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own invoices" 
ON public.seller_invoices FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all invoices" 
ON public.seller_invoices FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Trigger to update updated_at
CREATE TRIGGER update_seller_invoices_updated_at
BEFORE UPDATE ON public.seller_invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
