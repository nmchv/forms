import { supabase, type SessionUser, type UserRole } from './supabase';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'expired';
export type AuthErrorCode = 'none' | 'profile_error' | 'role_missing' | 'role_error' | 'auth_error';

export interface AuthResult {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  code: AuthErrorCode;
}

function buildUser(
  user: { id: string; email: string | null },
  profile: { username: string | null; display_name: string | null } | null,
  role: UserRole | null,
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? user.email ?? 'Пользователь',
    role,
  };
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { profile: null, error: error.message };
  return { profile: data ?? null, error: null };
}

async function fetchRole(userId: string) {
  const { data, error } = await supabase
    .from('tutor_user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { role: null, missing: false, error: error.message };
  if (!data) return { role: null, missing: true, error: null };
  return { role: (data.role as UserRole) ?? null, missing: false, error: null };
}

export async function resolveAuth(): Promise<AuthResult> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return {
      status: 'unauthenticated',
      user: null,
      error: 'Активная сессия не найдена',
      code: 'auth_error',
    };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      status: 'expired',
      user: null,
      error: userError?.message || 'Сессия истекла',
      code: 'auth_error',
    };
  }

  const { profile, error: profileError } = await fetchProfile(user.id);
  if (profileError) {
    return {
      status: 'authenticated',
      user: buildUser(user, null, null),
      error: 'Не удалось загрузить профиль',
      code: 'profile_error',
    };
  }

  const { role, missing, error: roleError } = await fetchRole(user.id);
  if (roleError) {
    return {
      status: 'authenticated',
      user: buildUser(user, profile, null),
      error: 'Не удалось загрузить роль',
      code: 'role_error',
    };
  }

  const sessionUser = buildUser(user, profile, role);

  if (missing) {
    return {
      status: 'authenticated',
      user: sessionUser,
      error: 'Роль не назначена. Обратитесь к администратору, чтобы получить доступ к формам.',
      code: 'role_missing',
    };
  }

  return {
    status: 'authenticated',
    user: sessionUser,
    error: null,
    code: 'none',
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const result = await resolveAuth();
  return result.code === 'none' ? result.user : null;
}

export async function signOut() {
  await supabase.auth.signOut();
}
