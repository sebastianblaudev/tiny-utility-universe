
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  } | null;
}

export function UserAvatar({ user }: UserAvatarProps) {
  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || '';
  
  // Get initials from full name or email
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={avatarUrl} alt={fullName} />
      <AvatarFallback className="text-xs">
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
