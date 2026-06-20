'use client';

import { useEffect, useState, useCallback } from 'react';

export interface CartItem { productSlug?: string; name: string; price: number; qty: number; image?: string }

const KEY = 'webstudio_cart';
const EVENT = 'webstudio-cart-changed';

function read(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/** Lightweight localStorage cart shared across storefront blocks. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const handler = () => setItems(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => { window.removeEventListener(EVENT, handler); window.removeEventListener('storage', handler); };
  }, []);

  const add = useCallback((item: CartItem) => {
    const cur = read();
    const idx = cur.findIndex((i) => i.name === item.name && i.productSlug === item.productSlug);
    if (idx >= 0) cur[idx]!.qty += item.qty || 1;
    else cur.push({ ...item, qty: item.qty || 1 });
    write(cur);
  }, []);

  const setQty = useCallback((index: number, qty: number) => {
    const cur = read();
    if (!cur[index]) return;
    if (qty <= 0) cur.splice(index, 1); else cur[index]!.qty = qty;
    write(cur);
  }, []);

  const remove = useCallback((index: number) => { const cur = read(); cur.splice(index, 1); write(cur); }, []);
  const clear = useCallback(() => write([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}
