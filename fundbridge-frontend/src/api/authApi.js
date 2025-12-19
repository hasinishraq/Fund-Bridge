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

const normalizeAuthResponse = ({ token, refreshToken, user }) => ({
  token,
  refreshToken,
  user: {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    emailVerified: user?.emailVerified,
    status: user?.status,
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

export const requestRegistrationOtp = async ({ email, captchaToken }) => {
  await client.post('/auth/register/otp', {
    email,
    captchaToken,
  })
}

export const register = async ({ name, email, password, role, otp, captchaToken }) => {
  const { data } = await client.post('/auth/register', {
    name,
    email,
    password,
    role,
    otp,
    captchaToken,
  })
  return normalizeAuthResponse(data)
}

export const fetchProfile = async () => {
  const { data } = await client.get('/auth/me')
  return data
}

export const refreshSession = async ({ refreshToken }) => {
  const { data } = await client.post('/auth/token/refresh', { refreshToken })
  return normalizeAuthResponse(data)
}
