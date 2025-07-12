
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

// Calculate cart total
export const calculateCartTotal = (cartItems: ProductType[]): number => {
  return cartItems.reduce((total, item) => total + (item.subtotal || 0), 0);
};
