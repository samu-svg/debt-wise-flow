
-- Habilitar RLS na tabela user_folder_configs se ainda não estiver habilitado
ALTER TABLE public.user_folder_configs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias configurações
CREATE POLICY "Users can view their own folder configs" 
  ON public.user_folder_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias configurações
CREATE POLICY "Users can create their own folder configs" 
  ON public.user_folder_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias configurações
CREATE POLICY "Users can update their own folder configs" 
  ON public.user_folder_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias configurações
CREATE POLICY "Users can delete their own folder configs" 
  ON public.user_folder_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);
