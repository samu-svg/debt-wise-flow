
-- Criar tabela para logs detalhados do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID,
  function_name VARCHAR(100)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS whatsapp_logs_user_id_idx ON public.whatsapp_logs(user_id);
CREATE INDEX IF NOT EXISTS whatsapp_logs_timestamp_idx ON public.whatsapp_logs(timestamp);
CREATE INDEX IF NOT EXISTS whatsapp_logs_type_idx ON public.whatsapp_logs(type);
CREATE INDEX IF NOT EXISTS whatsapp_logs_level_idx ON public.whatsapp_logs(level);

-- Adicionar colunas necessárias na tabela de mensagens
ALTER TABLE public.mensagens_cobranca 
ADD COLUMN IF NOT EXISTS whatsapp_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS status_entrega VARCHAR(50) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS erro_detalhes TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_received BOOLEAN DEFAULT false;

-- Criar tabela para configurações seguras do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token_encrypted TEXT,
  phone_number_id VARCHAR(50),
  business_account_id VARCHAR(50),
  webhook_token VARCHAR(100) DEFAULT 'whatsapp_webhook_token',
  is_active BOOLEAN DEFAULT false,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(20) DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_logs
CREATE POLICY "Users can view their own whatsapp logs" 
  ON public.whatsapp_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp logs" 
  ON public.whatsapp_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para whatsapp_credentials
CREATE POLICY "Users can view their own whatsapp credentials" 
  ON public.whatsapp_credentials FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp credentials" 
  ON public.whatsapp_credentials FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp credentials" 
  ON public.whatsapp_credentials FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_credentials_updated_at
    BEFORE UPDATE ON public.whatsapp_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_credentials_updated_at();

-- Função para limpeza automática de logs antigos (manter últimos 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.whatsapp_logs 
    WHERE timestamp < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
