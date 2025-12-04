-- Add end date column for multi-day events
ALTER TABLE public.deller_eventos 
ADD COLUMN data_evento_fim date;

-- Set existing events to have the same end date as start date (single day)
UPDATE public.deller_eventos 
SET data_evento_fim = data_evento 
WHERE data_evento_fim IS NULL;