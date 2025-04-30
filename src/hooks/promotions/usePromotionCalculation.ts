import { useState } from 'react';
import { initDB, Promotion } from '@/lib/db';
import { usePromotionUtils } from './usePromotionUtils';

export function usePromotionCalculation() {
  const { filterApplicableItems } = usePromotionUtils();

  // Check if a promotion code is valid - make it async explicitly
  const validatePromoCode = async (code: string): Promise<Promotion | null> => {
    try {
      const db = await initDB();
      const tx = db.transaction('promotions', 'readonly');
      const store = tx.objectStore('promotions');
      const promotions = await store.getAll();
      
      const now = new Date();
      const validPromotion = promotions.find(promo => 
        promo.code === code &&
        promo.active &&
        new Date(promo.startDate) <= now &&
        new Date(promo.endDate) >= now &&
        (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
        (!promo.daysOfWeek || promo.daysOfWeek.includes(now.getDay()))
      );
      
      return validPromotion || null;
    } catch (error) {
      console.error("Error validating promo code:", error);
      return null;
    }
  };

  // Calculate discount for a specific promotion
  const calculatePromotionDiscount = (promotion: Promotion, cart: any[], cartTotal: number) => {
    let discount = 0;
    let discountedItems: any[] = [];
    
    // Check minimum purchase requirement
    if (promotion.minimumPurchase && cartTotal < promotion.minimumPurchase) {
      return { discount: 0, items: [] };
    }
    
    switch (promotion.type) {
      case 'percentage': {
        // Filter items that this promotion applies to
        const applicableItems = filterApplicableItems(promotion, cart);
        if (applicableItems.length === 0) return { discount: 0, items: [] };
        
        const applicableTotal = applicableItems.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        
        discount = applicableTotal * (promotion.value / 100);
        discountedItems = applicableItems;
        break;
      }
      
      case 'fixed': {
        // Filter items that this promotion applies to
        const applicableItems = filterApplicableItems(promotion, cart);
        if (applicableItems.length === 0) return { discount: 0, items: [] };
        
        // Fixed amount discount is applied to total of applicable items
        discount = Math.min(
          promotion.value,
          applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        );
        discountedItems = applicableItems;
        break;
      }
      
      case 'bogo': {
        // Buy One Get One type discounts
        const applicableItems = filterApplicableItems(promotion, cart);
        if (applicableItems.length < 2) return { discount: 0, items: [] };
        
        // Sort items by price to get cheapest items free
        const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
        
        // Calculate total discount based on the value (e.g., 50% = buy one get one half off)
        let remainingFreeItems = Math.floor(sortedItems.reduce((sum, item) => sum + item.quantity, 0) / 2);
        
        if (remainingFreeItems === 0) return { discount: 0, items: [] };
        
        // Apply discount to the cheapest items
        for (const item of sortedItems) {
          if (remainingFreeItems <= 0) break;
          
          const freeItemsForThisProduct = Math.min(remainingFreeItems, item.quantity);
          discount += item.price * freeItemsForThisProduct * (promotion.value / 100);
          remainingFreeItems -= freeItemsForThisProduct;
          discountedItems.push(item);
        }
        break;
      }
      
      case 'bundle': {
        // Bundle discounts - specific combination of items gets a discount
        if (promotion.applicableProducts.length === 0) return { discount: 0, items: [] };
        
        // Check if all required products are in the cart
        const bundleProducts = promotion.applicableProducts;
        const bundleInCart = bundleProducts.every(productId => 
          cart.some(item => item.id === productId || item.productId === productId)
        );
        
        if (!bundleInCart) return { discount: 0, items: [] };
        
        // Calculate the total price of bundle items
        const bundleItems = cart.filter(item => 
          bundleProducts.includes(item.id) || bundleProducts.includes(item.productId)
        );
        
        const bundleTotal = bundleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Apply fixed discount or percentage
        if (promotion.value <= 100) {
          // Percentage discount
          discount = bundleTotal * (promotion.value / 100);
        } else {
          // Fixed amount discount
          discount = Math.min(promotion.value, bundleTotal);
        }
        
        discountedItems = bundleItems;
        break;
      }
    }
    
    // Round discount to 2 decimal places
    return { 
      discount: Math.round(discount * 100) / 100,
      items: discountedItems 
    };
  };

  // Calculate best discount for a cart based on applicable promotions - already returns a Promise
  const calculateBestDiscount = async (cart: any[], appliedPromoCode: string | null = null) => {
    if (cart.length === 0) {
      return { 
        discount: 0, 
        appliedPromotion: null,
        discountedItems: [],
        originalTotal: 0,
        finalTotal: 0
      };
    }
    
    // Calculate original cart total
    const originalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let bestDiscount = 0;
    let bestPromotion = null;
    let discountedItems: any[] = [];
    
    try {
      const db = await initDB();
      const tx = db.transaction('promotions', 'readonly');
      const store = tx.objectStore('promotions');
      const promotions = await store.getAll();
      
      const now = new Date();
      const activePromotions = promotions.filter(promo => 
        promo.active && 
        new Date(promo.startDate) <= now && 
        new Date(promo.endDate) >= now &&
        (!promo.usageLimit || promo.usageCount < promo.usageLimit) &&
        (!promo.daysOfWeek || promo.daysOfWeek.includes(now.getDay()))
      );
      
      // Check if there's a promo code applied first
      if (appliedPromoCode) {
        const promoCodePromotion = activePromotions.find(p => p.code === appliedPromoCode);
        if (promoCodePromotion) {
          const { discount, items } = calculatePromotionDiscount(promoCodePromotion, cart, originalTotal);
          bestDiscount = discount;
          bestPromotion = promoCodePromotion;
          discountedItems = items;
        }
      } else {
        // Try all active promotions and find the best one
        for (const promotion of activePromotions) {
          const { discount, items } = calculatePromotionDiscount(promotion, cart, originalTotal);
          if (discount > bestDiscount) {
            bestDiscount = discount;
            bestPromotion = promotion;
            discountedItems = items;
          }
        }
      }
    } catch (error) {
      console.error("Error calculating best discount:", error);
    }
    
    return {
      discount: bestDiscount,
      appliedPromotion: bestPromotion,
      discountedItems,
      originalTotal,
      finalTotal: originalTotal - bestDiscount
    };
  };

  return {
    validatePromoCode,
    calculateBestDiscount,
    calculatePromotionDiscount
  };
}
