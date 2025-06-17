
-- Primeiro, remover as foreign keys que dependem da tabela dividas
ALTER TABLE public.mensagens_cobranca DROP CONSTRAINT IF EXISTS mensagens_cobranca_divida_id_fkey;

-- Agora podemos recriar a tabela dividas
DROP TABLE IF EXISTS public.dividas CASCADE;
CREATE TABLE public.dividas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  data_vencimento date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Recriar a foreign key na tabela mensagens_cobranca
ALTER TABLE public.mensagens_cobranca 
ADD CONSTRAINT mensagens_cobranca_divida_id_fkey 
FOREIGN KEY (divida_id) REFERENCES public.dividas(id) ON DELETE SET NULL;

-- Adicionar colunas que podem estar faltando na tabela clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco text;

-- Criar tabela para configurações de usuário 
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  whatsapp_token text,
  whatsapp_phone_id text,
  backup_enabled boolean DEFAULT false,
  auto_backup_frequency text DEFAULT 'daily',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can view their own dividas" ON public.dividas;
DROP POLICY IF EXISTS "Users can view their own clientes_cobranca" ON public.clientes_cobranca;
DROP POLICY IF EXISTS "Users can view their own mensagens" ON public.mensagens_cobranca;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Users can view their own configs" ON public.configuracoes_automacao;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

-- Criar políticas RLS
CREATE POLICY "Users can view their own clientes" ON public.clientes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own dividas" ON public.dividas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own clientes_cobranca" ON public.clientes_cobranca
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own mensagens" ON public.mensagens_cobranca
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own templates" ON public.templates_cobranca
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own configs" ON public.configuracoes_automacao
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dividas_updated_at ON public.dividas;
CREATE TRIGGER update_dividas_updated_at BEFORE UPDATE ON public.dividas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar configurações padrão quando usuário se registra
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar configurações padrão do usuário
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Criar configurações de automação padrão
  INSERT INTO public.configuracoes_automacao (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Criar templates padrão
  INSERT INTO public.templates_cobranca (user_id, nome, tipo, template)
  VALUES 
    (NEW.id, 'Lembrete Amigável', 'lembrete_amigavel', 'Olá {{nome}}! Sua fatura de R${{valor}} vence em breve. Não se esqueça de quitar! 😊'),
    (NEW.id, 'Cobrança Formal', 'cobranca_formal', 'Prezado(a) {{nome}}, informamos que sua fatura no valor de R${{valor}} está vencida há {{diasAtraso}} dias. Por favor, regularize sua situação.'),
    (NEW.id, 'Último Aviso', 'ultimo_aviso', 'ATENÇÃO {{nome}}! Sua dívida de R${{valorTotal}} (original: R${{valor}} + multa/juros) está {{diasAtraso}} dias em atraso. Última oportunidade antes das medidas legais.')
  ON CONFLICT (user_id, nome) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar quando um novo usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_defaults();
