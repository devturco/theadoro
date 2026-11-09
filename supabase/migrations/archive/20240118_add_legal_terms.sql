-- Add columns for legal tracking to seller_applications
ALTER TABLE seller_applications 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_legal_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_legal_ip TEXT;

-- Add site settings for legal documents
INSERT INTO site_settings (section, key, label, value, type)
VALUES 
('juridico', 'terms_of_use', 'Termos de Uso', '"Contrato inicial de termos de uso..."', 'text'),
('juridico', 'privacy_policy', 'Política de Privacidade', '"Sua privacidade é importante para nós..."', 'text')
ON CONFLICT (section, key) DO NOTHING;
