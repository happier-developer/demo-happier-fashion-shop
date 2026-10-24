"use client";

// Giỏ hàng phía client (ARCHITECTURE.md mục 6): chỉ lưu ở localStorage
// của trình duyệt, khóa `happier-fashion-cart`, không có bảng cart trên DB.
// Dòng giỏ định danh bằng key = productId + variantId (thời trang bắt buộc
// phân biệt size/màu — hai biến thể cùng sản phẩm KHÔNG được gộp).
// Nguồn dữ kiện là localStorage, đọc qua useSyncExternalStore: an toàn với
// SSR/hydration (server luôn thấy giỏ trống) và đồng bộ giữa các component.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export const CART_STORAGE_KEY = "happier-fashion-cart";
const CART_CHANGE_EVENT = "happier-fashion-cart-change";

export interface CartItem {
  /** Khóa dòng giỏ: `${productId}:${variantId}` hoặc productId khi không có biến thể. */
  key: string;
  productId: string;
  variantId?: string | null;
  variantLabel?: string | null;
  slug: string;
  name: string;
  priceVnd: number;
  imageUrl?: string | null;
  quantity: number;
}

export function cartItemKey(productId: string, variantId?: string | null) {
  return variantId ? `${productId}:${variantId}` : productId;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalPriceVnd: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity" | "key">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CartItem).productId === "string" &&
          typeof (item as CartItem).quantity === "number" &&
          (item as CartItem).quantity > 0,
      )
      .map((item) => ({
        ...item,
        key:
          item.key ??
          cartItemKey(item.productId, item.variantId ?? null),
      }));
  } catch {
    return [];
  }
}

function readCartItems(): CartItem[] {
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeCartItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage đầy/bị chặn: bỏ qua, vẫn phát sự kiện để UI đồng bộ.
  }
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCartSnapshot(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerCartSnapshot(): string | null {
  return null;
}

function subscribeNoop() {
  return () => {};
}

export function CartProvider({ children }: { children: ReactNode }) {
  const rawCart = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const items = useMemo(() => parseCart(rawCart), [rawCart]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity" | "key">, quantity: number = 1) => {
      const key = cartItemKey(item.productId, item.variantId ?? null);
      const prev = readCartItems();
      const existing = prev.find((i) => i.key === key);
      const next = existing
        ? prev.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [...prev, { ...item, key, quantity }];
      writeCartItems(next);
    },
    [],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    const prev = readCartItems();
    const next =
      quantity <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity } : i));
    writeCartItems(next);
  }, []);

  const removeItem = useCallback((key: string) => {
    writeCartItems(readCartItems().filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => writeCartItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPriceVnd = items.reduce(
      (sum, i) => sum + i.priceVnd * i.quantity,
      0,
    );
    return {
      items,
      totalQuantity,
      totalPriceVnd,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    };
  }, [items, hydrated, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart phải dùng bên trong <CartProvider>.");
  }
  return ctx;
}
