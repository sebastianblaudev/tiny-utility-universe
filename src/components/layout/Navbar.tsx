
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { UserAvatar } from '@/components/user-avatar';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';

const Navbar = () => {
  const { onOpen } = useSidebar();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((path, index, array) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1),
      path: `/${array.slice(0, index + 1).join('/')}`,
    }));

  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="flex h-16 items-center px-4">
        <Button variant="ghost" onClick={onOpen} className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
        {breadcrumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-2 ml-4">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <a href={crumb.path} className="text-sm text-muted-foreground hover:underline">
                  {crumb.name}
                </a>
                {index < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        
        <div className="ml-auto flex items-center space-x-4">
          <SyncStatusIndicator />
          <UserAvatar user={user} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
