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
      ambientes: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          grupo: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          grupo?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          grupo?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      analises: {
        Row: {
          coordenada_x: number
          coordenada_y: number
          created_at: string
          descricao_problema: string
          id: string
          norma: string
          pagina: number
          projeto_id: string
          severidade: Database["public"]["Enums"]["severidade"]
          sugestao: string
        }
        Insert: {
          coordenada_x?: number
          coordenada_y?: number
          created_at?: string
          descricao_problema: string
          id?: string
          norma: string
          pagina?: number
          projeto_id: string
          severidade: Database["public"]["Enums"]["severidade"]
          sugestao: string
        }
        Update: {
          coordenada_x?: number
          coordenada_y?: number
          created_at?: string
          descricao_problema?: string
          id?: string
          norma?: string
          pagina?: number
          projeto_id?: string
          severidade?: Database["public"]["Enums"]["severidade"]
          sugestao?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      entidades_arquitetonicas: {
        Row: {
          altura: number | null
          ambiente: string | null
          coord_x: number
          coord_y: number
          created_at: string
          id: string
          largura: number | null
          metadados: Json
          pagina: number
          projeto_id: string
          tipo: string
        }
        Insert: {
          altura?: number | null
          ambiente?: string | null
          coord_x?: number
          coord_y?: number
          created_at?: string
          id?: string
          largura?: number | null
          metadados?: Json
          pagina?: number
          projeto_id: string
          tipo: string
        }
        Update: {
          altura?: number | null
          ambiente?: string | null
          coord_x?: number
          coord_y?: number
          created_at?: string
          id?: string
          largura?: number | null
          metadados?: Json
          pagina?: number
          projeto_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "entidades_arquitetonicas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      pareceres: {
        Row: {
          checklist: Json
          gerado_em: string
          id: string
          impacto_regulatorio: string | null
          projeto_id: string
          resumo_executivo: string | null
          risco_sanitario: string | null
          status_final: Database["public"]["Enums"]["parecer_status"]
        }
        Insert: {
          checklist?: Json
          gerado_em?: string
          id?: string
          impacto_regulatorio?: string | null
          projeto_id: string
          resumo_executivo?: string | null
          risco_sanitario?: string | null
          status_final: Database["public"]["Enums"]["parecer_status"]
        }
        Update: {
          checklist?: Json
          gerado_em?: string
          id?: string
          impacto_regulatorio?: string | null
          projeto_id?: string
          resumo_executivo?: string | null
          risco_sanitario?: string | null
          status_final?: Database["public"]["Enums"]["parecer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pareceres_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cnpj: string | null
          crea_cau: string | null
          created_at: string
          email: string | null
          email_corporativo: string | null
          id: string
          nome: string | null
          nome_fantasia: string | null
          profissao: string | null
          razao_social: string | null
          registro_profissional: string | null
          responsavel_tecnico: string | null
          telefone: string | null
          tipo_usuario: Database["public"]["Enums"]["user_type"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          crea_cau?: string | null
          created_at?: string
          email?: string | null
          email_corporativo?: string | null
          id: string
          nome?: string | null
          nome_fantasia?: string | null
          profissao?: string | null
          razao_social?: string | null
          registro_profissional?: string | null
          responsavel_tecnico?: string | null
          telefone?: string | null
          tipo_usuario?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          crea_cau?: string | null
          created_at?: string
          email?: string | null
          email_corporativo?: string | null
          id?: string
          nome?: string | null
          nome_fantasia?: string | null
          profissao?: string | null
          razao_social?: string | null
          registro_profissional?: string | null
          responsavel_tecnico?: string | null
          telefone?: string | null
          tipo_usuario?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          arquivo_path: string | null
          arquivo_url: string | null
          created_at: string
          id: string
          nome_projeto: string
          score_conformidade: number
          status: Database["public"]["Enums"]["projeto_status"]
          tipo_arquivo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          arquivo_path?: string | null
          arquivo_url?: string | null
          created_at?: string
          id?: string
          nome_projeto: string
          score_conformidade?: number
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo_arquivo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          arquivo_path?: string | null
          arquivo_url?: string | null
          created_at?: string
          id?: string
          nome_projeto?: string
          score_conformidade?: number
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo_arquivo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      regras_regulatorias: {
        Row: {
          ambiente_aplicavel: string[]
          ativa: boolean
          categoria: Database["public"]["Enums"]["regra_categoria"]
          codigo: string
          created_at: string
          descricao: string
          id: string
          nome: string
          norma: string
          parametros: Json
          severidade: Database["public"]["Enums"]["regra_severidade"]
          sugestao_corretiva: string
          tipo_validacao: Database["public"]["Enums"]["regra_tipo_validacao"]
          updated_at: string
        }
        Insert: {
          ambiente_aplicavel?: string[]
          ativa?: boolean
          categoria: Database["public"]["Enums"]["regra_categoria"]
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          nome: string
          norma: string
          parametros?: Json
          severidade: Database["public"]["Enums"]["regra_severidade"]
          sugestao_corretiva: string
          tipo_validacao: Database["public"]["Enums"]["regra_tipo_validacao"]
          updated_at?: string
        }
        Update: {
          ambiente_aplicavel?: string[]
          ativa?: boolean
          categoria?: Database["public"]["Enums"]["regra_categoria"]
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          norma?: string
          parametros?: Json
          severidade?: Database["public"]["Enums"]["regra_severidade"]
          sugestao_corretiva?: string
          tipo_validacao?: Database["public"]["Enums"]["regra_tipo_validacao"]
          updated_at?: string
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          gerado_em: string
          id: string
          projeto_id: string
          relatorio_pdf: string | null
          status_final: Database["public"]["Enums"]["projeto_status"]
        }
        Insert: {
          gerado_em?: string
          id?: string
          projeto_id: string
          relatorio_pdf?: string | null
          status_final: Database["public"]["Enums"]["projeto_status"]
        }
        Update: {
          gerado_em?: string
          id?: string
          projeto_id?: string
          relatorio_pdf?: string | null
          status_final?: Database["public"]["Enums"]["projeto_status"]
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          calculado_em: string
          id: string
          projeto_id: string
          score_acessibilidade: number
          score_fluxo: number
          score_geral: number
          score_por_ambiente: Json
          score_por_norma: Json
        }
        Insert: {
          calculado_em?: string
          id?: string
          projeto_id: string
          score_acessibilidade?: number
          score_fluxo?: number
          score_geral?: number
          score_por_ambiente?: Json
          score_por_norma?: Json
        }
        Update: {
          calculado_em?: string
          id?: string
          projeto_id?: string
          score_acessibilidade?: number
          score_fluxo?: number
          score_geral?: number
          score_por_ambiente?: Json
          score_por_norma?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scores_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validacoes: {
        Row: {
          created_at: string
          detalhes: Json
          entidade_id: string | null
          id: string
          projeto_id: string
          regra_id: string
          severidade_efetiva: Database["public"]["Enums"]["regra_severidade"]
          status: Database["public"]["Enums"]["validacao_status"]
          valor_observado: number | null
        }
        Insert: {
          created_at?: string
          detalhes?: Json
          entidade_id?: string | null
          id?: string
          projeto_id: string
          regra_id: string
          severidade_efetiva: Database["public"]["Enums"]["regra_severidade"]
          status: Database["public"]["Enums"]["validacao_status"]
          valor_observado?: number | null
        }
        Update: {
          created_at?: string
          detalhes?: Json
          entidade_id?: string | null
          id?: string
          projeto_id?: string
          regra_id?: string
          severidade_efetiva?: Database["public"]["Enums"]["regra_severidade"]
          status?: Database["public"]["Enums"]["validacao_status"]
          valor_observado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "validacoes_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades_arquitetonicas"
            referencedColumns: ["id"]
          },
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      parecer_status:
        | "aprovado"
        | "parcialmente_conforme"
        | "revisao_necessaria"
        | "reprovado"
      projeto_status:
        | "pendente"
        | "analisando"
        | "aprovado"
        | "parcial"
        | "reprovado"
      regra_categoria:
        | "acessibilidade"
        | "fluxo_sanitario"
        | "dimensional"
        | "ventilacao"
        | "funcional"
        | "estrutural"
        | "biosseguranca"
        | "operacao"
        | "esterilizacao"
      regra_severidade: "informativo" | "atencao" | "critico" | "bloqueante"
      regra_tipo_validacao:
        | "dimensional"
        | "presencial"
        | "fluxo"
        | "barreira"
        | "ventilacao"
        | "area_minima"
      severidade: "critico" | "atencao" | "conforme"
      user_type: "profissional" | "empresa"
      validacao_status: "conforme" | "parcial" | "inconforme" | "nao_aplicavel"
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
    Enums: {
      app_role: ["admin", "user"],
      parecer_status: [
        "aprovado",
        "parcialmente_conforme",
        "revisao_necessaria",
        "reprovado",
      ],
      projeto_status: [
        "pendente",
        "analisando",
        "aprovado",
        "parcial",
        "reprovado",
      ],
      regra_categoria: [
        "acessibilidade",
        "fluxo_sanitario",
        "dimensional",
        "ventilacao",
        "funcional",
        "estrutural",
        "biosseguranca",
        "operacao",
        "esterilizacao",
      ],
      regra_severidade: ["informativo", "atencao", "critico", "bloqueante"],
      regra_tipo_validacao: [
        "dimensional",
        "presencial",
        "fluxo",
        "barreira",
        "ventilacao",
        "area_minima",
      ],
      severidade: ["critico", "atencao", "conforme"],
      user_type: ["profissional", "empresa"],
      validacao_status: ["conforme", "parcial", "inconforme", "nao_aplicavel"],
    },
  },
} as const
