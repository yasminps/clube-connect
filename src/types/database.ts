// Mirrors the initial migrations. Regenerate with the Supabase CLI after schema changes.
type Enums = {
  club_role: "ADMIN" | "DIRECTOR" | "COUNSELOR" | "MEMBER";
  event_kind: "MEETING" | "EVENT" | "ACTIVITY";
  attendance_status: "PRESENT" | "ABSENT";
  submission_status: "PENDING" | "APPROVED" | "REJECTED";
  point_category: "INDIVIDUAL" | "COLETIVA";
  point_origin: "MANUAL" | "EVENT" | "CHALLENGE" | "ADJUSTMENT" | "REVERSAL";
};
type Relationship = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };
type Table<Row, Insert, Relations extends Relationship[]> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: Relations };
export type Database = {
  public: {
    Enums: Enums;
    CompositeTypes: Record<never, never>;
    Functions: {
      password_change_required: { Args: Record<never, never>; Returns: boolean };
      rename_counselor: { Args: { target: string; counselor_name: string }; Returns: undefined };
      prepare_counselor_account: { Args: { actor: string; email_address: string; counselor_name: string; targets: string[] }; Returns: string };
      manage_counselor: { Args: { target: string; targets: string[] | null; enabled: boolean | null }; Returns: undefined };
      save_attendance: {
        Args: { event: string; entries: { member_id: string; status: Enums["attendance_status"]; justification: string | null }[] };
        Returns: Database["public"]["Tables"]["attendance"]["Row"][];
      };
    };
    Views: {
      leadership_directory: { Row: { id: string; display_name: string; email: string | null; active: boolean; confirmed: boolean; must_change_password: boolean }; Relationships: [] };
      club_identity: { Row: { name: string }; Relationships: [] };
      counselor_directory: { Row: { id: string; display_name: string }; Relationships: [] };
      unit_directory: { Row: { id: string; code: string; name: string; description: string; color: string; active: boolean; member_count: number; active_member_count: number; points: number; symbol_image: string | null }; Relationships: [] };
      unit_ranking: { Row: { unit_id: string; name: string; color: string; points: number; position: number }; Relationships: [] };
    };
    Tables: {
      directory_audit: Table<
        { id: string; entity: string; record_id: string; related_user_id: string | null; operation: string; actor_id: string | null; changed_fields: string[]; created_at: string },
        { id?: string; entity: string; record_id: string; related_user_id?: string | null; operation: string; actor_id?: string | null; changed_fields: string[]; created_at?: string },
        []
      >;
      club_settings: Table<
        { id: number; name: string; description: string; timezone: string; created_at: string; updated_at: string },
        { id?: number; name: string; description?: string; timezone?: string; created_at?: string; updated_at?: string },
        []
      >;
      profiles: Table<
        { id: string; display_name: string; must_change_password: boolean; created_at: string; updated_at: string },
        { id: string; display_name: string; must_change_password?: boolean; created_at?: string; updated_at?: string },
        []
      >;
      user_roles: Table<
        { user_id: string; role: Enums["club_role"]; active: boolean; created_at: string; updated_at: string },
        { user_id: string; role: Enums["club_role"]; active?: boolean; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "user_roles_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      >;
      units: Table<
        { id: string; code: string; name: string; description: string; color: string; active: boolean; symbol_image: string | null; created_at: string; updated_at: string },
        { id?: string; code: string; name: string; description?: string; color?: string; active?: boolean; symbol_image?: string | null; created_at?: string; updated_at?: string },
        []
      >;
      members: Table<
        { id: string; user_id: string | null; unit_id: string; name: string; joined_on: string; active: boolean; created_at: string; updated_at: string },
        { id?: string; user_id?: string | null; unit_id: string; name: string; joined_on?: string; active?: boolean; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "members_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "members_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }]
      >;
      unit_staff: Table<
        { unit_id: string; user_id: string; created_at: string; updated_at: string },
        { unit_id: string; user_id: string; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "unit_staff_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }, { foreignKeyName: "unit_staff_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      >;
      guardians: Table<
        { id: string; name: string; email: string | null; phone: string | null; created_at: string; updated_at: string },
        { id?: string; name: string; email?: string | null; phone?: string | null; created_at?: string; updated_at?: string },
        []
      >;
      member_guardians: Table<
        { member_id: string; guardian_id: string; relationship: string; created_at: string; updated_at: string },
        { member_id: string; guardian_id: string; relationship: string; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "member_guardians_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "members"; referencedColumns: ["id"] }, { foreignKeyName: "member_guardians_guardian_id_fkey"; columns: ["guardian_id"]; isOneToOne: false; referencedRelation: "guardians"; referencedColumns: ["id"] }]
      >;
      events: Table<
        { id: string; unit_id: string | null; title: string; kind: Enums["event_kind"]; starts_at: string; ends_at: string | null; location: string; description: string; created_at: string; updated_at: string },
        { id?: string; unit_id?: string | null; title: string; kind: Enums["event_kind"]; starts_at: string; ends_at?: string | null; location?: string; description?: string; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "events_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }]
      >;
      attendance: Table<
        { event_id: string; member_id: string; unit_id: string; status: Enums["attendance_status"]; justification: string | null; recorded_by: string; created_at: string; updated_at: string },
        { event_id: string; member_id: string; unit_id?: string; status: Enums["attendance_status"]; justification?: string | null; recorded_by?: string; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "attendance_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }, { foreignKeyName: "attendance_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "members"; referencedColumns: ["id"] }, { foreignKeyName: "attendance_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }, { foreignKeyName: "attendance_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      >;
      challenges: Table<
        { id: string; title: string; description: string; deadline: string; points: number; published_at: string | null; created_at: string; updated_at: string },
        { id?: string; title: string; description: string; deadline: string; points: number; published_at?: string | null; created_at?: string; updated_at?: string },
        []
      >;
      challenge_submissions: Table<
        { challenge_id: string; unit_id: string; submitted_by: string; notes: string; status: Enums["submission_status"]; created_at: string; updated_at: string },
        { challenge_id: string; unit_id: string; submitted_by?: string; notes?: string; status?: Enums["submission_status"]; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "challenge_submissions_challenge_id_fkey"; columns: ["challenge_id"]; isOneToOne: false; referencedRelation: "challenges"; referencedColumns: ["id"] }, { foreignKeyName: "challenge_submissions_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }, { foreignKeyName: "challenge_submissions_submitted_by_fkey"; columns: ["submitted_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      >;
      point_transactions: Table<
        { id: string; category: Enums["point_category"]; member_id: string | null; unit_id: string | null; amount: number; reason: string; origin: Enums["point_origin"]; event_id: string | null; challenge_id: string | null; recorded_by: string; reversal_of: string | null; created_at: string; updated_at: string },
        { id?: string; category: Enums["point_category"]; member_id?: string | null; unit_id?: string | null; amount: number; reason: string; origin: Enums["point_origin"]; event_id?: string | null; challenge_id?: string | null; recorded_by?: string; reversal_of?: string | null; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "point_transactions_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "members"; referencedColumns: ["id"] }, { foreignKeyName: "point_transactions_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }, { foreignKeyName: "point_transactions_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] }, { foreignKeyName: "point_transactions_challenge_id_fkey"; columns: ["challenge_id"]; isOneToOne: false; referencedRelation: "challenges"; referencedColumns: ["id"] }, { foreignKeyName: "point_transactions_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "point_transactions_reversal_of_fkey"; columns: ["reversal_of"]; isOneToOne: true; referencedRelation: "point_transactions"; referencedColumns: ["id"] }]
      >;
      announcements: Table<
        { id: string; unit_id: string | null; title: string; body: string; important: boolean; published_at: string | null; created_at: string; updated_at: string },
        { id?: string; unit_id?: string | null; title: string; body: string; important?: boolean; published_at?: string | null; created_at?: string; updated_at?: string },
        [{ foreignKeyName: "announcements_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }]
      >;
    };
  };
};
export type ClubRole = Enums["club_role"];
export type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
