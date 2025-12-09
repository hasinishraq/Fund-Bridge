import client from './client'

/**
 * Example direct axios usage via the gateway:
 * await axios.post(
 *   'http://localhost:8080/api/auth/login',
 *   { email, password },
 *   { headers: { 'Content-Type': 'application/json' } }
 * );
 *
 * await axios.get('http://localhost:8080/api/auth/me', {
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 */

const normalizeAuthResponse = ({ token, user }) => ({
  token,
  user: {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: user?.role,
    kycApplicantId: user?.kycApplicantId,
    kycStatus: user?.kycStatus,
    kycReviewUrl: user?.kycReviewUrl,
  },
})

export const login = async ({ email, password, captchaToken }) => {
  const { data } = await client.post('/auth/login', {
    email,
    password,
    captchaToken,
  })
  return normalizeAuthResponse(data)
}

export const register = async (payload) => {
  const { data } = await client.post('/auth/register', payload)
  return normalizeAuthResponse(data)
}

export const fetchProfile = async () => {
  const { data } = await client.get('/auth/me')
  return data
}
