
import { useState } from 'react';
import { initDB, Promotion } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { usePromotionUtils } from './usePromotionUtils';

export function usePromotionCRUD() {
  const { toast } = useToast();
  const { isPromotionActive } = usePromotionUtils();

  // Create a new promotion
  const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'usageCount' | 'createdAt'>) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("No se pudo abrir la base de datos");
      }
      
      const newPromotion: Promotion = {
        ...promotionData,
        id: uuidv4(),
        usageCount: 0,
        createdAt: new Date()
      };
      
      const tx = db.transaction('promotions', 'readwrite');
      const store = tx.objectStore('promotions');
      await store.add(newPromotion);
      
      toast({
        title: "Promoción creada",
        description: `La promoción "${newPromotion.name}" ha sido creada exitosamente`,
      });
      
      return newPromotion;
    } catch (err) {
      console.error("Error creating promotion:", err);
      toast({
        title: "Error",
        description: "No se pudo crear la promoción",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update an existing promotion
  const updatePromotion = async (id: string, promotionData: Partial<Promotion>) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("No se pudo abrir la base de datos");
      }
      
      const tx = db.transaction('promotions', 'readwrite');
      const store = tx.objectStore('promotions');
      
      const existingPromotion = await store.get(id);
      if (!existingPromotion) {
        throw new Error("Promoción no encontrada");
      }
      
      const updatedPromotion: Promotion = {
        ...existingPromotion,
        ...promotionData,
      };
      
      await store.put(updatedPromotion);
      
      toast({
        title: "Promoción actualizada",
        description: `La promoción "${updatedPromotion.name}" ha sido actualizada exitosamente`,
      });
      
      return updatedPromotion;
    } catch (err) {
      console.error("Error updating promotion:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la promoción",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Delete a promotion
  const deletePromotion = async (id: string) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("No se pudo abrir la base de datos");
      }
      
      const tx = db.transaction('promotions', 'readwrite');
      const store = tx.objectStore('promotions');
      
      const existingPromotion = await store.get(id);
      if (!existingPromotion) {
        throw new Error("Promoción no encontrada");
      }
      
      await store.delete(id);
      
      toast({
        title: "Promoción eliminada",
        description: `La promoción "${existingPromotion.name}" ha sido eliminada exitosamente`,
      });
      
      return true;
    } catch (err) {
      console.error("Error deleting promotion:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la promoción",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Record promotion usage
  const recordPromotionUsage = async (id: string) => {
    try {
      const db = await initDB();
      if (!db) {
        throw new Error("No se pudo abrir la base de datos");
      }
      
      const tx = db.transaction('promotions', 'readwrite');
      const store = tx.objectStore('promotions');
      
      const promotion = await store.get(id);
      if (!promotion) {
        throw new Error("Promoción no encontrada");
      }
      
      const updatedPromotion = {
        ...promotion,
        usageCount: promotion.usageCount + 1
      };
      
      await store.put(updatedPromotion);
      
      return updatedPromotion;
    } catch (err) {
      console.error("Error recording promotion usage:", err);
      throw err;
    }
  };

  return {
    createPromotion,
    updatePromotion,
    deletePromotion,
    recordPromotionUsage
  };
}
