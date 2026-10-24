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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assinantes: {
        Row: {
          created_at: string
          curso: string | null
          data_inicio: string
          dia_vencimento: number
          email: string | null
          horario_checkin: string | null
          id: string
          instituicao: string | null
          lead_id: string | null
          nome: string
          observacoes: string | null
          pagamento_status: string
          plano: string
          status: string
          valor_mensal: number
          whatsapp: string
        }
        Insert: {
          created_at?: string
          curso?: string | null
          data_inicio?: string
          dia_vencimento: number
          email?: string | null
          horario_checkin?: string | null
          id?: string
          instituicao?: string | null
          lead_id?: string | null
          nome: string
          observacoes?: string | null
          pagamento_status?: string
          plano: string
          status?: string
          valor_mensal: number
          whatsapp: string
        }
        Update: {
          created_at?: string
          curso?: string | null
          data_inicio?: string
          dia_vencimento?: number
          email?: string | null
          horario_checkin?: string | null
          id?: string
          instituicao?: string | null
          lead_id?: string | null
          nome?: string
          observacoes?: string | null
          pagamento_status?: string
          plano?: string
          status?: string
          valor_mensal?: number
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinantes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          anotacoes: string | null
          assinante_id: string
          created_at: string
          data: string
          id: string
          status: string
          tipo: string
        }
        Insert: {
          anotacoes?: string | null
          assinante_id: string
          created_at?: string
          data: string
          id?: string
          status?: string
          tipo: string
        }
        Update: {
          anotacoes?: string | null
          assinante_id?: string
          created_at?: string
          data?: string
          id?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_assinante_id_fkey"
            columns: ["assinante_id"]
            isOneToOne: false
            referencedRelation: "assinantes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          anotacoes: string | null
          consentimento_lgpd: boolean
          created_at: string
          curso: string
          cursos_complementares: string | null
          dificuldades: string[]
          email: string
          faz_idioma: boolean
          horario_checkin: string
          horas_livres: number
          horas_trabalho: number | null
          id: string
          idioma_detalhes: string | null
          instituicao: string
          nome: string
          objetivo: string
          periodo: number
          plano_interesse: string
          proximas_provas: string | null
          status: string
          trabalha: boolean
          turno: string
          whatsapp: string
        }
        Insert: {
          anotacoes?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          curso: string
          cursos_complementares?: string | null
          dificuldades?: string[]
          email: string
          faz_idioma?: boolean
          horario_checkin: string
          horas_livres: number
          horas_trabalho?: number | null
          id?: string
          idioma_detalhes?: string | null
          instituicao: string
          nome: string
          objetivo: string
          periodo: number
          plano_interesse: string
          proximas_provas?: string | null
          status?: string
          trabalha?: boolean
          turno: string
          whatsapp: string
        }
        Update: {
          anotacoes?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          curso?: string
          cursos_complementares?: string | null
          dificuldades?: string[]
          email?: string
          faz_idioma?: boolean
          horario_checkin?: string
          horas_livres?: number
          horas_trabalho?: number | null
          id?: string
          idioma_detalhes?: string | null
          instituicao?: string
          nome?: string
          objetivo?: string
          periodo?: number
          plano_interesse?: string
          proximas_provas?: string | null
          status?: string
          trabalha?: boolean
          turno?: string
          whatsapp?: string
        }
        Relationships: []
      }
      lembretes: {
        Row: {
          assinante_id: string | null
          concluido: boolean
          created_at: string
          data_hora: string
          descricao: string | null
          id: string
          titulo: string
        }
        Insert: {
          assinante_id?: string | null
          concluido?: boolean
          created_at?: string
          data_hora: string
          descricao?: string | null
          id?: string
          titulo: string
        }
        Update: {
          assinante_id?: string | null
          concluido?: boolean
          created_at?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_assinante_id_fkey"
            columns: ["assinante_id"]
            isOneToOne: false
            referencedRelation: "assinantes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
