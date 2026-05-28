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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      normas_regulatorias: {
        Row: {
          ativa: boolean | null
          codigo: string
          created_at: string | null
          data_publicacao: string | null
          data_vigencia: string | null
          descricao: string | null
          id: string
          nome: string
          orgao_emissor: string | null
          url_oficial: string | null
        }
        Insert: {
          ativa?: boolean | null
          codigo: string
          created_at?: string | null
          data_publicacao?: string | null
          data_vigencia?: string | null
          descricao?: string | null
          id?: string
          nome: string
          orgao_emissor?: string | null
          url_oficial?: string | null
        }
        Update: {
          ativa?: boolean | null
          codigo?: string
          created_at?: string | null
          data_publicacao?: string | null
          data_vigencia?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          orgao_emissor?: string | null
          url_oficial?: string | null
        }
        Relationships: []
      }
      pareceres: {
        Row: {
          created_at: string | null
          id: string
          nivel_risco: string | null
          norma_id: string | null
          parecer: string | null
          projeto_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nivel_risco?: string | null
          norma_id?: string | null
          parecer?: string | null
          projeto_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nivel_risco?: string | null
          norma_id?: string | null
          parecer?: string | null
          projeto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pareceres_norma_id_fkey"
            columns: ["norma_id"]
            isOneToOne: false
            referencedRelation: "normas_regulatorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pareceres_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          cnpj: string | null
          crea_cau: string | null
          created_at: string | null
          id: string
          nome: string | null
          tipo: string | null
        }
        Insert: {
          cnpj?: string | null
          crea_cau?: string | null
          created_at?: string | null
          id: string
          nome?: string | null
          tipo?: string | null
        }
        Update: {
          cnpj?: string | null
          crea_cau?: string | null
          created_at?: string | null
          id?: string
          nome?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      projetos: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string | null
          id: string
          nome_projeto: string
          observacoes: string | null
          pdf_nome: string | null
          pdf_path: string | null
          resultado: Json | null
          score: number | null
          score_conformidade: number | null
          status: string | null
          status_analise: string | null
          tipo_arquivo: string | null
          tipo_estabelecimento: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          id?: string
          nome_projeto: string
          observacoes?: string | null
          pdf_nome?: string | null
          pdf_path?: string | null
          resultado?: Json | null
          score?: number | null
          score_conformidade?: number | null
          status?: string | null
          status_analise?: string | null
          tipo_arquivo?: string | null
          tipo_estabelecimento: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          id?: string
          nome_projeto?: string
          observacoes?: string | null
          pdf_nome?: string | null
          pdf_path?: string | null
          resultado?: Json | null
          score?: number | null
          score_conformidade?: number | null
          status?: string | null
          status_analise?: string | null
          tipo_arquivo?: string | null
          tipo_estabelecimento?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      regras_regulatorias: {
        Row: {
          artigo_referencia: string | null
          categoria: string | null
          codigo: string
          codigo_regra: string | null
          created_at: string | null
          descricao: string
          id: string
          norma_id: string | null
          norma_origem: string | null
          obrigatorio: boolean
          subcategoria: string | null
          tipo_estabelecimento: string | null
          unidade: string | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          artigo_referencia?: string | null
          categoria?: string | null
          codigo: string
          codigo_regra?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          norma_id?: string | null
          norma_origem?: string | null
          obrigatorio?: boolean
          subcategoria?: string | null
          tipo_estabelecimento?: string | null
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          artigo_referencia?: string | null
          categoria?: string | null
          codigo?: string
          codigo_regra?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          norma_id?: string | null
          norma_origem?: string | null
          obrigatorio?: boolean
          subcategoria?: string | null
          tipo_estabelecimento?: string | null
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_regulatorias_norma_id_fkey"
            columns: ["norma_id"]
            isOneToOne: false
            referencedRelation: "normas_regulatorias"
            referencedColumns: ["id"]
          },
        ]
      }
      validacoes: {
        Row: {
          created_at: string | null
          id: string
          observacao: string | null
          projeto_id: string | null
          regra_id: string | null
          severidade_efetiva: string | null
          status: string
          valor_encontrado: string | null
          valor_esperado: string | null
          valor_observado: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          projeto_id?: string | null
          regra_id?: string | null
          severidade_efetiva?: string | null
          status: string
          valor_encontrado?: string | null
          valor_esperado?: string | null
          valor_observado?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          projeto_id?: string | null
          regra_id?: string | null
          severidade_efetiva?: string | null
          status?: string
          valor_encontrado?: string | null
          valor_esperado?: string | null
          valor_observado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "validacoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validacoes_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_regulatorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_credentials: {
        Args: { _cnpj: string; _crea_cau: string }
        Returns: string
      }
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
