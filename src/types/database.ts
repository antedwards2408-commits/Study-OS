// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If the schema changes, update this file to match (or regenerate with the
// Supabase CLI: `supabase gen types typescript`).

export type MaterialType = "pdf" | "text";
export type MaterialStatus = "pending" | "processing" | "ready" | "error";
export type Difficulty = "easy" | "medium" | "hard";
export type ChatRole = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
          Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          subject: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
          Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["topics"]["Row"]> & {
          course_id: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["topics"]["Row"]>;
          Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          title: string;
          type: MaterialType;
          storage_path: string | null;
          raw_text: string | null;
          status: MaterialStatus;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["materials"]["Row"]> & {
          course_id: string;
          user_id: string;
          title: string;
          type: MaterialType;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Row"]>;
          Relationships: [];
      };
      material_chunks: {
        Row: {
          id: string;
          material_id: string;
          course_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
          topic_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["material_chunks"]["Row"]> & {
          material_id: string;
          course_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["material_chunks"]["Row"]>;
          Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          material_id: string | null;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]> & {
          user_id: string;
          course_id: string;
          role: ChatRole;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
          Relationships: [];
      };
      flashcards: {
        Row: {
          id: string;
          material_id: string;
          course_id: string;
          user_id: string;
          topic_id: string | null;
          question: string;
          answer: string;
          difficulty: Difficulty;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["flashcards"]["Row"]> & {
          material_id: string;
          course_id: string;
          user_id: string;
          question: string;
          answer: string;
        };
        Update: Partial<Database["public"]["Tables"]["flashcards"]["Row"]>;
          Relationships: [];
      };
      flashcard_reviews: {
        Row: {
          id: string;
          flashcard_id: string;
          user_id: string;
          known: boolean;
          reviewed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["flashcard_reviews"]["Row"]> & {
          flashcard_id: string;
          user_id: string;
          known: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["flashcard_reviews"]["Row"]>;
          Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          course_id: string;
          material_id: string | null;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quizzes"]["Row"]> & {
          course_id: string;
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Row"]>;
          Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          topic_id: string | null;
          question: string;
          choices: string[];
          correct_index: number;
          explanation: string | null;
          order_index: number;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_questions"]["Row"]> & {
          quiz_id: string;
          question: string;
          choices: string[];
          correct_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Row"]>;
          Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          course_id: string;
          user_id: string;
          score: number;
          total: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_attempts"]["Row"]> & {
          quiz_id: string;
          course_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Row"]>;
          Relationships: [];
      };
      quiz_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          topic_id: string | null;
          user_id: string;
          selected_index: number | null;
          is_correct: boolean;
          answered_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quiz_answers"]["Row"]> & {
          attempt_id: string;
          question_id: string;
          user_id: string;
          is_correct: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_answers"]["Row"]>;
          Relationships: [];
      };
      practice_sessions: {
        Row: {
          id: string;
          course_id: string;
          topic_id: string;
          user_id: string;
          score: number;
          total: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["practice_sessions"]["Row"]> & {
          course_id: string;
          topic_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["practice_sessions"]["Row"]>;
          Relationships: [];
      };
      practice_questions: {
        Row: {
          id: string;
          practice_session_id: string;
          question: string;
          choices: string[];
          correct_index: number;
          explanation: string | null;
          selected_index: number | null;
          is_correct: boolean | null;
          order_index: number;
        };
        Insert: Partial<Database["public"]["Tables"]["practice_questions"]["Row"]> & {
          practice_session_id: string;
          question: string;
          choices: string[];
          correct_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["practice_questions"]["Row"]>;
          Relationships: [];
      };
      topic_mastery: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          topic_id: string;
          mastery: number;
          attempts_count: number;
          last_attempt_at: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["topic_mastery"]["Row"]> & {
          user_id: string;
          course_id: string;
          topic_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["topic_mastery"]["Row"]>;
          Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_material_chunks: {
        Args: { p_material_id: string; p_query: string; p_limit?: number };
        Returns: {
          id: string;
          chunk_index: number;
          content: string;
          topic_id: string | null;
          rank: number;
        }[];
      };
      search_course_chunks: {
        Args: { p_course_id: string; p_query: string; p_limit?: number };
        Returns: {
          id: string;
          material_id: string;
          chunk_index: number;
          content: string;
          topic_id: string | null;
          rank: number;
        }[];
      };
      chunks_for_topic: {
        Args: { p_topic_id: string; p_limit?: number };
        Returns: { id: string; material_id: string; content: string }[];
      };
    };
  };
}
