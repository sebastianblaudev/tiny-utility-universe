
import { useState, useEffect } from 'react';
import { initDB, Promotion } from '@/lib/db';

export function usePromotionData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);

  // Load all promotions
  useEffect(() => {
    const loadPromotions = async () => {
      setIsLoading(true);
      try {
        const db = await initDB();
        if (!db) {
          throw new Error("No se pudo abrir la base de datos");
        }
        
        const tx = db.transaction('promotions', 'readonly');
        const store = tx.objectStore('promotions');
        const allPromotions = await store.getAll();
        
        setPromotions(allPromotions);
        
        // Filter active promotions
        const now = new Date();
        const active = allPromotions.filter(promo => 
          promo.active && 
          new Date(promo.startDate) <= now && 
          new Date(promo.endDate) >= now &&
          (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
          (!promo.daysOfWeek || promo.daysOfWeek.includes(now.getDay()))
        );
        
        setActivePromotions(active);
      } catch (err) {
        console.error("Error loading promotions:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPromotions();
  }, []);

  return {
    promotions,
    setPromotions,
    activePromotions,
    setActivePromotions,
    isLoading,
    error
  };
}
