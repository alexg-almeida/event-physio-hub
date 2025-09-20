-- Create eventos table
CREATE TABLE public.deller_eventos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    local TEXT NOT NULL,
    valor_inscricao DECIMAL(10,2) NOT NULL DEFAULT 0,
    vagas_totais INTEGER NOT NULL DEFAULT 0,
    vagas_ocupadas INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'finalizado')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inscricoes table
CREATE TABLE public.deller_inscricoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_id UUID NOT NULL REFERENCES public.deller_eventos(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    cpf TEXT NOT NULL,
    endereco TEXT NOT NULL,
    telefone TEXT NOT NULL,
    lesoes TEXT,
    tratamento TEXT,
    status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado', 'expirado')),
    data_inscricao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    valor_pago DECIMAL(10,2),
    codigo_validacao TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(evento_id, cpf)
);

-- Create pagamentos table
CREATE TABLE public.deller_pagamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inscricao_id UUID NOT NULL REFERENCES public.deller_inscricoes(id) ON DELETE CASCADE,
    asaas_payment_id TEXT,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'expirado')),
    metodo_pagamento TEXT,
    data_vencimento DATE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create validacoes table
CREATE TABLE public.deller_validacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    inscricao_id UUID NOT NULL REFERENCES public.deller_inscricoes(id) ON DELETE CASCADE,
    codigo_validacao TEXT NOT NULL,
    validado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    validado_por TEXT,
    dispositivo_validacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.deller_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deller_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deller_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deller_validacoes ENABLE ROW LEVEL SECURITY;

-- Create policies for eventos (publicly readable, admin writable)
CREATE POLICY "Eventos are viewable by everyone" 
ON public.deller_eventos 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage eventos" 
ON public.deller_eventos 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for inscricoes
CREATE POLICY "Users can view their own inscricoes" 
ON public.deller_inscricoes 
FOR SELECT 
USING (true); -- Initially public for admin dashboard

CREATE POLICY "Users can create inscricoes" 
ON public.deller_inscricoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update inscricoes" 
ON public.deller_inscricoes 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policies for pagamentos
CREATE POLICY "Pagamentos are viewable by authenticated users" 
ON public.deller_pagamentos 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Pagamentos can be inserted by anyone" 
ON public.deller_pagamentos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only authenticated users can update pagamentos" 
ON public.deller_pagamentos 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policies for validacoes
CREATE POLICY "Validacoes are viewable by authenticated users" 
ON public.deller_validacoes 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can create validacoes" 
ON public.deller_validacoes 
FOR INSERT 
WITH CHECK (true);

-- Create function to update vagas_ocupadas automatically
CREATE OR REPLACE FUNCTION public.update_vagas_ocupadas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status_pagamento = 'pago' THEN
        UPDATE public.deller_eventos 
        SET vagas_ocupadas = vagas_ocupadas + 1
        WHERE id = NEW.evento_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status_pagamento != 'pago' AND NEW.status_pagamento = 'pago' THEN
            UPDATE public.deller_eventos 
            SET vagas_ocupadas = vagas_ocupadas + 1
            WHERE id = NEW.evento_id;
        ELSIF OLD.status_pagamento = 'pago' AND NEW.status_pagamento != 'pago' THEN
            UPDATE public.deller_eventos 
            SET vagas_ocupadas = vagas_ocupadas - 1
            WHERE id = NEW.evento_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status_pagamento = 'pago' THEN
        UPDATE public.deller_eventos 
        SET vagas_ocupadas = vagas_ocupadas - 1
        WHERE id = OLD.evento_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic updates
CREATE TRIGGER update_deller_eventos_updated_at
    BEFORE UPDATE ON public.deller_eventos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deller_inscricoes_updated_at
    BEFORE UPDATE ON public.deller_inscricoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deller_pagamentos_updated_at
    BEFORE UPDATE ON public.deller_pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vagas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.deller_inscricoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vagas_ocupadas();

-- Create indexes for better performance
CREATE INDEX idx_deller_inscricoes_evento_id ON public.deller_inscricoes(evento_id);
CREATE INDEX idx_deller_inscricoes_cpf ON public.deller_inscricoes(cpf);
CREATE INDEX idx_deller_inscricoes_codigo_validacao ON public.deller_inscricoes(codigo_validacao);
CREATE INDEX idx_deller_pagamentos_inscricao_id ON public.deller_pagamentos(inscricao_id);
CREATE INDEX idx_deller_pagamentos_asaas_payment_id ON public.deller_pagamentos(asaas_payment_id);
CREATE INDEX idx_deller_validacoes_inscricao_id ON public.deller_validacoes(inscricao_id);

-- Insert a sample event for testing
INSERT INTO public.deller_eventos (nome, descricao, data_evento, local, valor_inscricao, vagas_totais)
VALUES (
    'Evento de Fisioterapia 2024',
    'Atendimentos variados de fisioterapia para o público em geral',
    '2024-12-01',
    'Centro de Convenções - São Paulo',
    50.00,
    200
);