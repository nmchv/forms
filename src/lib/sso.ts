import { supabase, type SessionUser } from './supabase';

const LOGIN_URL = import.meta.env.PUBLIC_SSO_LOGIN_URL || 'https://login.nmchv.ru';
const CALLBACK_URL = 'https://forms.nmchv.ru/auth/callback';

export interface SSOUser {
  id: string;
  email: string | null;
  display_name: string;
  role: string;
}

/**
 * Инициирует SSO-авторизацию через 중앙ный login.nmchv.ru.
 * Перенаправляет пользователя на центральную систему для аутентификации.
 * После успешного входа пользователь вернётся на callback-страницу Forms,
 * а затем — на страницу, с которой начал авторизацию.
 */
export function initiateSSO(returnTo: string = '/') {
  const params = new URLSearchParams({ return_to: returnTo });
  const callback = `${CALLBACK_URL}?${params.toString()}`;
  window.location.href = `${LOGIN_URL}/auth/callback?redirect_to=${encodeURIComponent(callback)}`;
}

/**
 * Обрабатывает ответ от 중앙ной системы после OAuth-авторизации.
 * Проверяет сессию Supabase (общая для обоих сайтов) и возвращает данные пользователя.
 */
export async function handleSSOCallback(): Promise<SessionUser | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) return null;

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

  return {
    id: session.user.id,
    email: session.user.email,
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? session.user.email ?? 'Пользователь',
    role: (roleRow?.role as SessionUser['role']) ?? 'student',
  };
}

/**
 * Получает текущего пользователя из сессии Supabase (общая с login.nmchv.ru).
 */
export async function getSSOUser(): Promise<SessionUser | null> {
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

  return {
    id: session.user.id,
    email: session.user.email,
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? session.user.email ?? 'Пользователь',
    role: (roleRow?.role as SessionUser['role']) ?? 'student',
  };
}

/**
 * Выход из аккаунта на обоих сайтах (общая сессия Supabase).
 */
export async function signOutSSO() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

/**
 * Извлекает return_to из URL(callback-страницы).
 */
export function getReturnTo(defaultPath: string = '/'): string {
  if (typeof window === 'undefined') return defaultPath;
  const params = new URLSearchParams(window.location.search);
  return params.get('return_to') ?? defaultPath;
}
