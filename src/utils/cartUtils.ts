
import { ProductType } from '@/types';

// Add an item to the cart
export const addItemToCart = (cartItems: ProductType[], product: ProductType, quantity: number = 1): ProductType[] => {
  const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
  
  if (existingItemIndex >= 0) {
    const updatedItems = [...cartItems];
    const newQuantity = updatedItems[existingItemIndex].quantity! + quantity;
    updatedItems[existingItemIndex] = {
      ...updatedItems[existingItemIndex],
      quantity: newQuantity,
      subtotal: parseFloat((product.price * newQuantity).toFixed(2))
    };
    return updatedItems;
  } else {
    return [...cartItems, {
      ...product,
      quantity,
      subtotal: parseFloat((product.price * quantity).toFixed(2)),
      notes: ''
    }];
  }
};

// Remove an item from the cart
export const removeItemFromCart = (cartItems: ProductType[], productId: string): ProductType[] => {
  return cartItems.filter(item => item.id !== productId);
};

// Update item quantity in the cart
export const updateItemQuantity = (
  cartItems: ProductType[], 
  productId: string, 
  newQuantity: number
): ProductType[] => {
  if (newQuantity < 1) return cartItems;
  
  return cartItems.map(item => {
    if (item.id === productId) {
      return {
        ...item,
        quantity: newQuantity,
        subtotal: parseFloat((item.price * newQuantity).toFixed(2))
      };
    }
    return item;
  });
};

// Update item note in the cart
export const updateItemNote = (
  cartItems: ProductType[], 
  productId: string, 
  note: string
): ProductType[] => {
  return cartItems.map(item => {
    if (item.id === productId) {
      return {
        ...item,
        notes: note
      };
    }
    return item;
  });
};

// Calculate cart total with enhanced precision
export const calculateCartTotal = (cartItems: ProductType[]): number => {
  return parseFloat(
    cartItems.reduce((total, item) => {
      const subtotal = item.subtotal || (item.price * (item.quantity || 1));
      return total + subtotal;
    }, 0).toFixed(2)
  );
};

// Validate cart item calculations
export const validateCartItem = (item: ProductType): boolean => {
  if (!item.price || item.price < 0) return false;
  if (!item.quantity || item.quantity <= 0) return false;
  
  const expectedSubtotal = parseFloat((item.price * item.quantity).toFixed(2));
  const actualSubtotal = item.subtotal || 0;
  
  // Allow 1 cent tolerance for floating point precision
  return Math.abs(expectedSubtotal - actualSubtotal) <= 0.01;
};

// Recalculate all cart items to ensure accuracy
export const recalculateCartItems = (cartItems: ProductType[]): ProductType[] => {
  return cartItems.map(item => ({
    ...item,
    subtotal: parseFloat((item.price * (item.quantity || 1)).toFixed(2))
  }));
};
