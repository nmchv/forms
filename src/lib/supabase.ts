import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Отсутствуют PUBLIC_SUPABASE_URL или PUBLIC_SUPABASE_ANON_KEY. См. .env.example');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'student' | 'tutor' | 'admin';

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string;
  role: UserRole;
}
