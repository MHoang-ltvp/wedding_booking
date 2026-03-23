import api from '../lib/api';

/** GET /api/users/me */
export async function fetchMe() {
  const { data } = await api.get('/users/me');
  return data;
}

/** PUT /api/users/me */
export async function updateMe(body) {
  const { data } = await api.put('/users/me', body);
  return data;
}
