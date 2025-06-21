
# API Notify Devedor

Esta Edge Function implementa um endpoint para notificar devedores via BotConversa.

## Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no Supabase:

```bash
BOTCONVERSA_WEBHOOK_URL=https://seu-webhook-botconversa.com/api/webhook
```

### Como configurar no Supabase

1. Acesse o painel do Supabase
2. Vá em Settings > Edge Functions
3. Adicione as variáveis de ambiente necessárias

## Endpoint

**POST** `/api/notify-devedor`

### Payload

```json
{
  "phone": "+5511999999999",
  "name": "João Silva",
  "flow": "cobranca_padrao",
  "customFields": {
    "valor_divida": 100.00,
    "dias_atraso": 5,
    "data_vencimento": "2024-01-15"
  }
}
```

### Validações

- `phone`: Obrigatório, formato +DDI+DDD+número (13 dígitos)
- `name`: Obrigatório, string não vazia
- `flow`: Obrigatório, identificador do fluxo no BotConversa
- `customFields`: Obrigatório, objeto com campos personalizados

### Respostas

#### Sucesso (200)
```json
{
  "success": true,
  "message": "Notificação enviada com sucesso",
  "data": {
    "id": "123",
    "status": "sent"
  }
}
```

#### Erro de Validação (400)
```json
{
  "error": "Dados inválidos",
  "details": [
    "Phone deve estar no formato +5511999999999 (DDI+DDD+número)"
  ]
}
```

#### Erro Interno (500)
```json
{
  "error": "Erro interno do servidor",
  "message": "Detalhes do erro"
}
```

## Testes

Execute os testes com:
```bash
npm test src/tests/notifyDevedor.test.ts
```

## Logs

Todos os requests e responses são logados para auditoria:
- Logs de sucesso incluem payload e resposta do BotConversa
- Logs de erro incluem detalhes do erro e dados da requisição
