/**
 * Token + user: localStorage (ghi nhớ) hoặc sessionStorage (tab hiện tại).
 */

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getUser() {
  const raw =
    localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {boolean} remember - true: localStorage; false: sessionStorage
 */
export function setSession(token, user, remember = true) {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;
  secondary.removeItem('token');
  secondary.removeItem('user');
  primary.setItem('token', token);
  primary.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}
