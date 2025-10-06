-- Dropar a política RESTRICTIVE existente que está bloqueando as inserções
DROP POLICY IF EXISTS "Anyone can create validacoes" ON public.deller_validacoes;

-- Criar nova política PERMISSIVE para INSERT
-- Permite tanto usuários anônimos quanto autenticados inserirem validações
CREATE POLICY "Allow anyone to create validacoes"
  ON public.deller_validacoes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);