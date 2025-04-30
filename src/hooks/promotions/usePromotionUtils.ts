
import { Promotion } from '@/lib/db';

export function usePromotionUtils() {
  // Helper function to check if a promotion is currently active
  const isPromotionActive = (promotion: Promotion): boolean => {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayString = today.toString();
    
    return (
      promotion.active &&
      new Date(promotion.startDate) <= now &&
      new Date(promotion.endDate) >= now &&
      (!promotion.usageLimit || promotion.usageCount < promotion.usageLimit) &&
      (!promotion.daysOfWeek || !promotion.daysOfWeek.length || promotion.daysOfWeek.includes(todayString))
    );
  };

  // Helper function to filter items applicable to a promotion
  const filterApplicableItems = (promotion: Promotion, cart: any[]) => {
    if (!promotion.applicableCategories?.length && !promotion.applicableProducts?.length) {
      // Promotion applies to all products
      return cart;
    }
    
    return cart.filter(item => {
      const itemCategoryId = item.categoryId || item.category;
      const itemProductId = item.id || item.productId;
      
      return (
        (promotion.applicableCategories && promotion.applicableCategories.includes(itemCategoryId)) ||
        (promotion.applicableProducts && promotion.applicableProducts.includes(itemProductId))
      );
    });
  };

  return {
    isPromotionActive,
    filterApplicableItems
  };
}
