export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      clientes_cobranca: {
        Row: {
          created_at: string | null
          data_vencimento: string
          id: string
          nome: string
          status: string | null
          updated_at: string | null
          user_id: string
          valor_divida: number
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          data_vencimento: string
          id?: string
          nome: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_divida: number
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_divida?: number
          whatsapp?: string
        }
        Relationships: []
      }
      configuracoes_automacao: {
        Row: {
          check_times: string[] | null
          created_at: string | null
          enabled: boolean | null
          escalation_after_due_1: number | null
          escalation_after_due_15: number | null
          escalation_after_due_30: number | null
          escalation_after_due_7: number | null
          escalation_before_due: number | null
          escalation_on_due: number | null
          holidays: string[] | null
          id: string
          max_messages_per_day: number | null
          message_delay: number | null
          response_timeout: number | null
          updated_at: string | null
          user_id: string
          work_days: number[] | null
        }
        Insert: {
          check_times?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          escalation_after_due_1?: number | null
          escalation_after_due_15?: number | null
          escalation_after_due_30?: number | null
          escalation_after_due_7?: number | null
          escalation_before_due?: number | null
          escalation_on_due?: number | null
          holidays?: string[] | null
          id?: string
          max_messages_per_day?: number | null
          message_delay?: number | null
          response_timeout?: number | null
          updated_at?: string | null
          user_id: string
          work_days?: number[] | null
        }
        Update: {
          check_times?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          escalation_after_due_1?: number | null
          escalation_after_due_15?: number | null
          escalation_after_due_30?: number | null
          escalation_after_due_7?: number | null
          escalation_before_due?: number | null
          escalation_on_due?: number | null
          holidays?: string[] | null
          id?: string
          max_messages_per_day?: number | null
          message_delay?: number | null
          response_timeout?: number | null
          updated_at?: string | null
          user_id?: string
          work_days?: number[] | null
        }
        Relationships: []
      }
      dividas: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_vencimento: string | null
          descricao: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_vencimento?: string | null
          descricao: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_cobranca: {
        Row: {
          cliente_id: string
          conversation_state: string | null
          divida_id: string | null
          enviado_em: string | null
          erro_detalhes: string | null
          id: string
          mensagem_enviada: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          response_received: boolean | null
          retry_count: number | null
          status_entrega: string | null
          template_usado: string
          tipo_mensagem: string
          user_id: string
          webhook_received_at: string | null
          whatsapp_message_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          cliente_id: string
          conversation_state?: string | null
          divida_id?: string | null
          enviado_em?: string | null
          erro_detalhes?: string | null
          id?: string
          mensagem_enviada: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          response_received?: boolean | null
          retry_count?: number | null
          status_entrega?: string | null
          template_usado: string
          tipo_mensagem: string
          user_id: string
          webhook_received_at?: string | null
          whatsapp_message_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          cliente_id?: string
          conversation_state?: string | null
          divida_id?: string | null
          enviado_em?: string | null
          erro_detalhes?: string | null
          id?: string
          mensagem_enviada?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          response_received?: boolean | null
          retry_count?: number | null
          status_entrega?: string | null
          template_usado?: string
          tipo_mensagem?: string
          user_id?: string
          webhook_received_at?: string | null
          whatsapp_message_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_cobranca_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_cobranca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_cobranca_divida_id_fkey"
            columns: ["divida_id"]
            isOneToOne: false
            referencedRelation: "dividas"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_cobranca: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          template: string
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          template: string
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          template?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_folder_configs: {
        Row: {
          configured_at: string
          folder_handle_data: Json | null
          folder_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configured_at?: string
          folder_handle_data?: Json | null
          folder_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configured_at?: string
          folder_handle_data?: Json | null
          folder_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_backup_frequency: string | null
          backup_enabled: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          whatsapp_phone_id: string | null
          whatsapp_token: string | null
        }
        Insert: {
          auto_backup_frequency?: string | null
          backup_enabled?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
        }
        Update: {
          auto_backup_frequency?: string | null
          backup_enabled?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
        }
        Relationships: []
      }
      whatsapp_credentials: {
        Row: {
          access_token_encrypted: string | null
          business_account_id: string | null
          created_at: string
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          phone_number_id: string | null
          updated_at: string
          user_id: string
          webhook_token: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          business_account_id?: string | null
          created_at?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          phone_number_id?: string | null
          updated_at?: string
          user_id: string
          webhook_token?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          business_account_id?: string | null
          created_at?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          phone_number_id?: string | null
          updated_at?: string
          user_id?: string
          webhook_token?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          data: Json | null
          function_name: string | null
          id: string
          level: string
          message: string
          session_id: string | null
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          data?: Json | null
          function_name?: string | null
          id?: string
          level?: string
          message: string
          session_id?: string | null
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          data?: Json | null
          function_name?: string | null
          id?: string
          level?: string
          message?: string
          session_id?: string | null
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_whatsapp_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      debt_status: "pendente" | "pago" | "atrasado"
      message_status: "enviada" | "entregue" | "lida" | "erro"
      message_type:
        | "lembrete_amigavel"
        | "urgencia_moderada"
        | "tom_serio"
        | "cobranca_formal"
        | "ultimo_aviso"
        | "ameaca_protesto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      debt_status: ["pendente", "pago", "atrasado"],
      message_status: ["enviada", "entregue", "lida", "erro"],
      message_type: [
        "lembrete_amigavel",
        "urgencia_moderada",
        "tom_serio",
        "cobranca_formal",
        "ultimo_aviso",
        "ameaca_protesto",
      ],
    },
  },
} as const
