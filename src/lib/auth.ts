import { supabase, type SessionUser } from './supabase';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', session.user.id)
    .single();

  const { data: roleRow } = await supabase
    .from('tutor_user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  const role = (roleRow?.role as SessionUser['role']) ?? 'student';

  return {
    id: session.user.id,
    email: session.user.email,
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? session.user.email ?? 'Пользователь',
    role,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export type { UserRole };
