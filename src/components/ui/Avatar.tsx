import { useStore } from '../../store/useStore'

export function Avatar({ userId, size = 24 }: { userId: string; size?: number }) {
  const user = useStore((s) => s.userById(userId))
  if (!user) return null
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-bg shrink-0"
      style={{ width: size, height: size, background: user.avatarColor, fontSize: size * 0.4 }}
      title={user.name}
    >
      {initials}
    </div>
  )
}
