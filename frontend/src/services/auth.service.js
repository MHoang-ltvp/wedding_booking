import api from '../lib/api';

/**
 * @returns {Promise<{ success: boolean, token?: string, user?: object, message?: string }>}
 */
export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', {
    email: String(email).trim(),
    password,
  });
  return data;
}

/**
 * @param {{ email, password, fullName, phone, role: 'CUSTOMER' | 'VENDOR' }} body
 */
export async function register(body) {
  const { data } = await api.post('/auth/register', {
    email: String(body.email).trim(),
    password: body.password,
    fullName: String(body.fullName).trim(),
    phone: String(body.phone).trim(),
    role: body.role,
  });
  return data;
}
