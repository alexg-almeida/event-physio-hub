export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      deller_eventos: {
        Row: {
          created_at: string
          data_evento: string
          descricao: string | null
          id: string
          local: string
          nome: string
          status: string
          updated_at: string
          vagas_ocupadas: number
          vagas_totais: number
          valor_inscricao: number
        }
        Insert: {
          created_at?: string
          data_evento: string
          descricao?: string | null
          id?: string
          local: string
          nome: string
          status?: string
          updated_at?: string
          vagas_ocupadas?: number
          vagas_totais?: number
          valor_inscricao?: number
        }
        Update: {
          created_at?: string
          data_evento?: string
          descricao?: string | null
          id?: string
          local?: string
          nome?: string
          status?: string
          updated_at?: string
          vagas_ocupadas?: number
          vagas_totais?: number
          valor_inscricao?: number
        }
        Relationships: []
      }
      deller_inscricoes: {
        Row: {
          codigo_validacao: string
          cpf: string
          created_at: string
          data_inscricao: string
          data_pagamento: string | null
          endereco: string
          evento_id: string
          id: string
          lesoes: string | null
          nome_completo: string
          qr_code_data: string | null
          status_pagamento: string
          telefone: string
          tratamento: string | null
          updated_at: string
          valor_pago: number | null
        }
        Insert: {
          codigo_validacao?: string
          cpf: string
          created_at?: string
          data_inscricao?: string
          data_pagamento?: string | null
          endereco: string
          evento_id: string
          id?: string
          lesoes?: string | null
          nome_completo: string
          qr_code_data?: string | null
          status_pagamento?: string
          telefone: string
          tratamento?: string | null
          updated_at?: string
          valor_pago?: number | null
        }
        Update: {
          codigo_validacao?: string
          cpf?: string
          created_at?: string
          data_inscricao?: string
          data_pagamento?: string | null
          endereco?: string
          evento_id?: string
          id?: string
          lesoes?: string | null
          nome_completo?: string
          qr_code_data?: string | null
          status_pagamento?: string
          telefone?: string
          tratamento?: string | null
          updated_at?: string
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deller_inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "deller_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      deller_pagamentos: {
        Row: {
          asaas_payment_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          inscricao_id: string
          metodo_pagamento: string | null
          status: string
          updated_at: string
          valor: number
          webhook_data: Json | null
        }
        Insert: {
          asaas_payment_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          inscricao_id: string
          metodo_pagamento?: string | null
          status?: string
          updated_at?: string
          valor: number
          webhook_data?: Json | null
        }
        Update: {
          asaas_payment_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          inscricao_id?: string
          metodo_pagamento?: string | null
          status?: string
          updated_at?: string
          valor?: number
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deller_pagamentos_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "deller_inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      deller_validacoes: {
        Row: {
          codigo_validacao: string
          created_at: string
          dispositivo_validacao: string | null
          id: string
          inscricao_id: string
          validado_em: string
          validado_por: string | null
        }
        Insert: {
          codigo_validacao: string
          created_at?: string
          dispositivo_validacao?: string | null
          id?: string
          inscricao_id: string
          validado_em?: string
          validado_por?: string | null
        }
        Update: {
          codigo_validacao?: string
          created_at?: string
          dispositivo_validacao?: string | null
          id?: string
          inscricao_id?: string
          validado_em?: string
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deller_validacoes_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "deller_inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
