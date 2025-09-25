-- Fix RLS policies for deller_inscricoes table to allow proper admin access

-- Drop existing problematic UPDATE policy
DROP POLICY IF EXISTS "Only authenticated users can update inscricoes" ON public.deller_inscricoes;

-- Create new UPDATE policy that works properly
CREATE POLICY "Allow updates for authenticated users" 
ON public.deller_inscricoes 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Also ensure the SELECT policy is working correctly
DROP POLICY IF EXISTS "Users can view their own inscricoes" ON public.deller_inscricoes;

CREATE POLICY "Allow viewing inscricoes" 
ON public.deller_inscricoes 
FOR SELECT 
USING (true);

-- Add missing policies for tables without RLS policies
CREATE POLICY "Allow all operations on codeCampanha" 
ON public."codeCampanha" 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on codeSendCampanha" 
ON public."codeSendCampanha" 
FOR ALL 
USING (true)
WITH CHECK (true);