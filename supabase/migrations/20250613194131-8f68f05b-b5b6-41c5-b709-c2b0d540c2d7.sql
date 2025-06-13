
-- Criar tabela de clientes com informações de cobrança
CREATE TABLE public.clientes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  valor_divida DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de histórico de mensagens
CREATE TABLE public.mensagens_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes_cobranca(id) ON DELETE CASCADE NOT NULL,
  tipo_mensagem VARCHAR(50) NOT NULL, -- '3_dias_antes', 'vencimento', '1_dia_atraso', '7_dias_atraso'
  template_usado TEXT NOT NULL,
  mensagem_enviada TEXT NOT NULL,
  status_entrega VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'enviado', 'entregue', 'lido', 'erro'
  whatsapp_message_id VARCHAR(255),
  erro_detalhes TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de templates de mensagem
CREATE TABLE public.templates_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- '3_dias_antes', 'vencimento', '1_dia_atraso', '7_dias_atraso'
  template TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes_cobranca
CREATE POLICY "Users can view their own clients" ON public.clientes_cobranca
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" ON public.clientes_cobranca
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON public.clientes_cobranca
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON public.clientes_cobranca
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para mensagens_cobranca
CREATE POLICY "Users can view their own messages" ON public.mensagens_cobranca
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON public.mensagens_cobranca
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.mensagens_cobranca
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para templates_cobranca
CREATE POLICY "Users can view their own templates" ON public.templates_cobranca
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" ON public.templates_cobranca
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates_cobranca
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates_cobranca
  FOR DELETE USING (auth.uid() = user_id);

-- Inserir templates padrão (serão criados para cada usuário via trigger)
CREATE OR REPLACE FUNCTION public.create_default_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- Template 3 dias antes
  INSERT INTO public.templates_cobranca (user_id, nome, tipo, template)
  VALUES (
    NEW.id,
    'Lembrete 3 dias antes',
    '3_dias_antes',
    'Olá {{nome}}! Sua fatura de R${{valor}} vence em 3 dias ({{data}}). Para evitar juros, quite em dia! 📅💰'
  );

  -- Template no vencimento
  INSERT INTO public.templates_cobranca (user_id, nome, tipo, template)
  VALUES (
    NEW.id,
    'Vencimento hoje',
    'vencimento',
    '{{nome}}, sua fatura vence hoje! Valor: R${{valor}} 📋 Evite multas e juros pagando hoje mesmo.'
  );

  -- Template 1 dia atrasado
  INSERT INTO public.templates_cobranca (user_id, nome, tipo, template)
  VALUES (
    NEW.id,
    'Atraso 1 dia',
    '1_dia_atraso',
    '{{nome}}, sua fatura está em atraso há 1 dia. Valor: R${{valor}} ⚠️ Regularize sua situação para evitar mais juros.'
  );

  -- Template 7 dias atrasado
  INSERT INTO public.templates_cobranca (user_id, nome, tipo, template)
  VALUES (
    NEW.id,
    'Atraso 7 dias',
    '7_dias_atraso',
    '{{nome}}, regularize sua situação! R${{valor}} - {{dias}} dias em atraso 🚨 Entre em contato conosco urgente.'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar templates padrão quando um usuário se registra
CREATE TRIGGER create_user_default_templates
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_templates();

-- Criar índices para performance
CREATE INDEX idx_clientes_cobranca_user_id ON public.clientes_cobranca(user_id);
CREATE INDEX idx_clientes_cobranca_data_vencimento ON public.clientes_cobranca(data_vencimento);
CREATE INDEX idx_clientes_cobranca_status ON public.clientes_cobranca(status);
CREATE INDEX idx_mensagens_cobranca_user_id ON public.mensagens_cobranca(user_id);
CREATE INDEX idx_mensagens_cobranca_cliente_id ON public.mensagens_cobranca(cliente_id);
CREATE INDEX idx_templates_cobranca_user_id ON public.templates_cobranca(user_id);
CREATE INDEX idx_templates_cobranca_tipo ON public.templates_cobranca(tipo);
