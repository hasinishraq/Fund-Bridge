import client from './client'

export const fetchInAppNotifications = async ({ userId, unreadOnly = false } = {}) => {
  if (!userId) {
    throw new Error('userId is required to load notifications')
  }
  const { data } = await client.get('/notifications/inapp', {
    params: {
      userId,
      unreadOnly,
    },
  })
  return data
}

export const markInAppNotificationRead = async ({ userId, notificationId } = {}) => {
  if (!userId || !notificationId) {
    throw new Error('userId and notificationId are required to mark notification as read')
  }
  const { data } = await client.post(`/notifications/inapp/${notificationId}/read`, null, {
    params: {
      userId,
    },
  })
  return data
}
