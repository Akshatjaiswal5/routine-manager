export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function scheduleDeadlineNotification(task) {
  if (!task.deadline_time || Notification.permission !== 'granted') return

  const [hours, minutes] = task.deadline_time.split(':').map(Number)
  const deadline = new Date()
  deadline.setHours(hours, minutes, 0, 0)

  // Notify 30 min before deadline
  const notifyAt = new Date(deadline.getTime() - 30 * 60 * 1000)
  const now = new Date()
  const delay = notifyAt.getTime() - now.getTime()

  if (delay <= 0) return

  setTimeout(() => {
    new Notification('Care Pal Reminder', {
      body: `"${task.name}" is due in 30 minutes`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  }, delay)
}

export function scheduleAllNotifications(tasks) {
  tasks.forEach(scheduleDeadlineNotification)
}
