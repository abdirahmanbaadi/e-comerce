export const CART_UPDATED_EVENT = 'cart-updated';

export function readCartItems() {
  try {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
  } catch {
    return [];
  }
}

export function readSavedItems() {
  try {
    return JSON.parse(localStorage.getItem('savedItems')) || [];
  } catch {
    return [];
  }
}

export function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function writeCartItems(items) {
  localStorage.setItem('cartItems', JSON.stringify(items));
  notifyCartUpdated();
}
