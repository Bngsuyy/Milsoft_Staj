import { useState } from 'react'
import type { User } from '../types'

interface UserAvatarProps {
  user: Pick<User, 'firstName' | 'lastName' | 'profileImageUrl'>
  className: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = user.profileImageUrl
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    .toLocaleUpperCase('tr-TR') || 'K'

  return (
    <span className={className} aria-hidden="true">
      {imageUrl && imageUrl !== failedImageUrl ? (
        <img
          className="user-avatar-image"
          src={imageUrl}
          alt=""
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : initials}
    </span>
  )
}
