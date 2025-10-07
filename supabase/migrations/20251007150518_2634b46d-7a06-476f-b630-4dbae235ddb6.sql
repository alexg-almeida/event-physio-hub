-- Corrigir política RLS: permitir consulta de validações para qualquer um (necessário para verificar duplicatas)
DROP POLICY IF EXISTS "Validacoes are viewable by authenticated users" ON public.deller_validacoes;

CREATE POLICY "Validacoes are viewable by anyone"
ON public.deller_validacoes
FOR SELECT
USING (true);