
import { useState, useEffect } from 'react';
import { usePromotionData } from './promotions/usePromotionData';
import { usePromotionCRUD } from './promotions/usePromotionCRUD';
import { usePromotionCalculation } from './promotions/usePromotionCalculation';
import { Promotion } from '@/lib/db';

export function usePromotions() {
  const { 
    promotions,
    activePromotions,
    isLoading,
    error
  } = usePromotionData();

  const {
    createPromotion,
    updatePromotion,
    deletePromotion,
    recordPromotionUsage
  } = usePromotionCRUD();

  const {
    validatePromoCode,
    calculateBestDiscount
  } = usePromotionCalculation();

  return {
    promotions,
    activePromotions,
    isLoading,
    error,
    createPromotion,
    updatePromotion,
    deletePromotion,
    recordPromotionUsage,
    validatePromoCode,
    calculateBestDiscount
  };
}
