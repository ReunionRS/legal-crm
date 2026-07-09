export function ClientAvatar({ client, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-24 w-24 rounded-3xl text-3xl' : 'h-10 w-10 rounded-full text-sm'
  const initials = client.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  if (client.avatarBase64) {
    return (
      <img
        src={client.avatarBase64}
        alt={client.fullName}
        className={`${sizeClass} border border-primary/10 object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-primary-fixed font-bold text-primary ${sizeClass}`}
      aria-label={client.fullName}
    >
      {initials}
    </div>
  )
}
