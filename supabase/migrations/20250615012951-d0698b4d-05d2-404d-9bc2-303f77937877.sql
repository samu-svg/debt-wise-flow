
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clientes_cobranca;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clientes_cobranca;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clientes_cobranca;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clientes_cobranca;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.mensagens_cobranca;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.mensagens_cobranca;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.mensagens_cobranca;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.mensagens_cobranca;

DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates_cobranca;

-- Habilitar RLS nas tabelas (se ainda não estiver habilitado)
ALTER TABLE public.clientes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;

-- Recriar todas as políticas
-- Políticas para clientes_cobranca
CREATE POLICY "Users can view their own clients" 
  ON public.clientes_cobranca 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
  ON public.clientes_cobranca 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON public.clientes_cobranca 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON public.clientes_cobranca 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para mensagens_cobranca
CREATE POLICY "Users can view their own messages" 
  ON public.mensagens_cobranca 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
  ON public.mensagens_cobranca 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
  ON public.mensagens_cobranca 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
  ON public.mensagens_cobranca 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para templates_cobranca
CREATE POLICY "Users can view their own templates" 
  ON public.templates_cobranca 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
  ON public.templates_cobranca 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
  ON public.templates_cobranca 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
  ON public.templates_cobranca 
  FOR DELETE 
  USING (auth.uid() = user_id);
