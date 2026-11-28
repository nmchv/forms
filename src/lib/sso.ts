import { signOut } from './auth';

const LOGIN_URL = import.meta.env.PUBLIC_SSO_LOGIN_URL || 'https://www.login.nmchv.ru';
const CALLBACK_HOST = 'www.forms.nmchv.ru';
const CALLBACK_URL = `https://${CALLBACK_HOST}/auth/callback`;

export function initiateSSO(returnTo: string = '/') {
  let target = returnTo;
  if (target.startsWith('/')) target = `https://${CALLBACK_HOST}${target}`;
  else if (!/^https?:\/\//i.test(target)) target = '/';

  const params = new URLSearchParams({ return_to: target });
  const callback = `${CALLBACK_URL}?${params.toString()}`;
  window.location.href = `${LOGIN_URL}/auth/callback?redirect_to=${encodeURIComponent(callback)}`;
}

export async function signOutSSO() {
  await signOut();
  window.location.replace('/');
}

export function getReturnTo(defaultPath: string = '/'): string {
  if (typeof window === 'undefined') return defaultPath;
  const raw = new URLSearchParams(window.location.search).get('return_to') ?? defaultPath;
  if (!raw || !raw.startsWith('/') || /^https?:\/\//i.test(raw)) return defaultPath;
  return raw;
}
