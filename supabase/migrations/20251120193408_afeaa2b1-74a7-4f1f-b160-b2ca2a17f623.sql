-- Permitir que usuários autenticados possam excluir inscrições
CREATE POLICY "Allow authenticated users to delete inscricoes"
ON deller_inscricoes
FOR DELETE
USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados possam excluir pagamentos
CREATE POLICY "Allow authenticated users to delete pagamentos"
ON deller_pagamentos
FOR DELETE
USING (auth.role() = 'authenticated');