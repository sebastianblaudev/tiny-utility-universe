import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId, getAllPageLocks } from '@/lib/supabase-helpers';

interface PageLock {
  id: string;
  tenant_id: string;
  page_route: string;
  page_name: string;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}

export const usePageLocks = () => {
  const [pageLocks, setPageLocks] = useState<PageLock[]>([]);
  const [lockedPages, setLockedPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPageLocks = async () => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      const locks = await getAllPageLocks(tenantId);
      setPageLocks(locks);
      setLockedPages(locks.filter(lock => lock.is_locked).map(lock => lock.page_route));
    } catch (error) {
      console.error('Error loading page locks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageLocks();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('page-locks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_locks'
        },
        (payload) => {
          console.log('Page lock changed:', payload);
          loadPageLocks(); // Reload all locks when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isPageLocked = (pageRoute: string): boolean => {
    return lockedPages.includes(pageRoute);
  };

  return {
    pageLocks,
    lockedPages,
    loading,
    isPageLocked,
    refreshLocks: loadPageLocks
  };
};