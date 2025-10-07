-- Limpar validações duplicadas usando ROW_NUMBER
WITH ranked_validacoes AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY inscricao_id ORDER BY validado_em ASC) as rn
  FROM public.deller_validacoes
)
DELETE FROM public.deller_validacoes
WHERE id IN (
  SELECT id FROM ranked_validacoes WHERE rn > 1
);