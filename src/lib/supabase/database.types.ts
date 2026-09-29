export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          changed_fields: string[] | null
          id: number
          identity_id: string | null
          label: string
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          operation: Database['public']['Enums']['audit_operation']
          refs: Json
          row_id: string | null
          table_name: string
          txid: number
        }
        Insert: {
          changed_fields?: string[] | null
          id?: never
          identity_id?: string | null
          label: string
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          operation: Database['public']['Enums']['audit_operation']
          refs?: Json
          row_id?: string | null
          table_name: string
          txid?: number
        }
        Update: {
          changed_fields?: string[] | null
          id?: never
          identity_id?: string | null
          label?: string
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          operation?: Database['public']['Enums']['audit_operation']
          refs?: Json
          row_id?: string | null
          table_name?: string
          txid?: number
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_identity_id_fkey'
            columns: ['identity_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      hall_reservations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          property_id: string
          reserved_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          property_id: string
          reserved_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          property_id?: string
          reserved_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'hall_reservations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hall_reservations_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'house_fee_status'
            referencedColumns: ['property_id']
          },
          {
            foreignKeyName: 'hall_reservations_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      maintenance_requests: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          details: string | null
          id: string
          rejection_reason: string | null
          requested_on: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database['public']['Enums']['request_status']
          title: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          rejection_reason?: string | null
          requested_on?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database['public']['Enums']['request_status']
          title: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          rejection_reason?: string | null
          requested_on?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database['public']['Enums']['request_status']
          title?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'maintenance_requests_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'maintenance_requests_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'maintenance_requests_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: true
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      periods: {
        Row: {
          created_at: string
          due_day: number
          ends_on: string
          id: string
          late_fee: number
          monthly_fee: number
          name: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_day?: number
          ends_on: string
          id?: string
          late_fee?: number
          monthly_fee: number
          name: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_day?: number
          ends_on?: string
          id?: string
          late_fee?: number
          monthly_fee?: number
          name?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          welcomed_at: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
          welcomed_at?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          welcomed_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          notes: string | null
          number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          notes?: string | null
          number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'properties_deleted_by_fkey'
            columns: ['deleted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      property_residents: {
        Row: {
          created_at: string
          property_id: string
          relationship: Database['public']['Enums']['residency_relationship']
          resident_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          relationship: Database['public']['Enums']['residency_relationship']
          resident_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          relationship?: Database['public']['Enums']['residency_relationship']
          resident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'property_residents_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'house_fee_status'
            referencedColumns: ['property_id']
          },
          {
            foreignKeyName: 'property_residents_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'property_residents_resident_id_fkey'
            columns: ['resident_id']
            isOneToOne: false
            referencedRelation: 'residents'
            referencedColumns: ['id']
          },
        ]
      }
      residents: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'residents_deleted_by_fkey'
            columns: ['deleted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'residents_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      security_requests: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          details: string | null
          id: string
          kind: Database['public']['Enums']['security_request_kind']
          rejection_reason: string | null
          requested_on: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database['public']['Enums']['request_status']
          title: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          kind?: Database['public']['Enums']['security_request_kind']
          rejection_reason?: string | null
          requested_on?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database['public']['Enums']['request_status']
          title: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          kind?: Database['public']['Enums']['security_request_kind']
          rejection_reason?: string | null
          requested_on?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database['public']['Enums']['request_status']
          title?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'security_requests_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'security_requests_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'security_requests_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: true
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      settings: {
        Row: {
          id: string
          logo_path: string | null
          residential_name: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          logo_path?: string | null
          residential_name?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          logo_path?: string | null
          residential_name?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string | null
          kind: Database['public']['Enums']['transaction_kind']
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string | null
          kind: Database['public']['Enums']['transaction_kind']
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string | null
          kind?: Database['public']['Enums']['transaction_kind']
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          fee_month: string | null
          folio: string | null
          id: string
          kind: Database['public']['Enums']['transaction_kind']
          notes: string | null
          occurred_on: string
          payment_method: Database['public']['Enums']['payment_method']
          period_id: string
          property_id: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          fee_month?: string | null
          folio?: string | null
          id?: string
          kind: Database['public']['Enums']['transaction_kind']
          notes?: string | null
          occurred_on?: string
          payment_method?: Database['public']['Enums']['payment_method']
          period_id: string
          property_id?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          fee_month?: string | null
          folio?: string | null
          id?: string
          kind?: Database['public']['Enums']['transaction_kind']
          notes?: string | null
          occurred_on?: string
          payment_method?: Database['public']['Enums']['payment_method']
          period_id?: string
          property_id?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_category_fkey'
            columns: ['category_id', 'kind']
            isOneToOne: false
            referencedRelation: 'transaction_categories'
            referencedColumns: ['id', 'kind']
          },
          {
            foreignKeyName: 'transactions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_deleted_by_fkey'
            columns: ['deleted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'house_fee_status'
            referencedColumns: ['period_id']
          },
          {
            foreignKeyName: 'transactions_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'periods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'treasury_period_summary'
            referencedColumns: ['period_id']
          },
          {
            foreignKeyName: 'transactions_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'house_fee_status'
            referencedColumns: ['property_id']
          },
          {
            foreignKeyName: 'transactions_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database['public']['Enums']['app_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_granted_by_fkey'
            columns: ['granted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      house_fee_status: {
        Row: {
          months_due: number | null
          months_paid: number | null
          number: string | null
          period_id: string | null
          property_id: string | null
          unpaid_months: string[] | null
        }
        Relationships: []
      }
      treasury_period_summary: {
        Row: {
          balance: number | null
          period_id: string | null
          total_expense: number | null
          total_income: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_resident: {
        Args: {
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_notes?: string
          p_phone: string
          p_property_id?: string
          p_relationship?: Database['public']['Enums']['residency_relationship']
        }
        Returns: string
      }
      financial_report: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      pay_maintenance_request: {
        Args: {
          p_category_id: string
          p_notes?: string
          p_occurred_on: string
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_reference?: string
          p_request_id: string
        }
        Returns: string
      }
      pay_security_request: {
        Args: {
          p_category_id: string
          p_notes?: string
          p_occurred_on: string
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_reference?: string
          p_request_id: string
        }
        Returns: string
      }
      record_fee_payment: {
        Args: {
          p_amount?: number
          p_apply_late_fee?: boolean
          p_fee_months: string[]
          p_folio: string
          p_notes?: string
          p_occurred_on: string
          p_payment_method?: Database['public']['Enums']['payment_method']
          p_period_id?: string
          p_property_id: string
          p_reference?: string
        }
        Returns: {
          fee_count: number
          late_fee_count: number
          total: number
        }[]
      }
      reject_maintenance_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      reject_security_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: 'admin' | 'president' | 'treasurer' | 'security' | 'maintenance'
      audit_operation: 'insert' | 'update' | 'delete'
      payment_method: 'cash' | 'transfer'
      request_status: 'pending' | 'paid' | 'rejected'
      residency_relationship: 'owner' | 'tenant' | 'family'
      security_request_kind: 'cameras' | 'guards' | 'access' | 'equipment' | 'other'
      transaction_kind: 'income' | 'expense'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'president', 'treasurer', 'security', 'maintenance'],
      audit_operation: ['insert', 'update', 'delete'],
      payment_method: ['cash', 'transfer'],
      request_status: ['pending', 'paid', 'rejected'],
      residency_relationship: ['owner', 'tenant', 'family'],
      security_request_kind: ['cameras', 'guards', 'access', 'equipment', 'other'],
      transaction_kind: ['income', 'expense'],
    },
  },
} as const
