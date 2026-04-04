import { Addon, CartItem, Product } from "@/types/supabase";
import { useState } from "react";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  function add(product: Product, addons: Addon[] = []) {
    setCart((prev) => {
      const key = addons
        .map((a) => a.id)
        .sort()
        .join(",");

      const exists = prev.find(
        (i) =>
          i.id === product.id &&
          i.selected_addons
            .map((a) => a.id)
            .sort()
            .join(",") === key,
      );

      if (exists) {
        return prev.map((i) =>
          i === exists ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }

      return [...prev, { ...product, quantity: 1, selected_addons: addons }];
    });
  }

  function remove(id: string) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  const total = cart.reduce((acc, item) => {
    const addons = item.selected_addons.reduce(
      (s, a) => s + Number(a.price),
      0,
    );
    return acc + (item.price + addons) * item.quantity;
  }, 0);

  return { cart, add, remove, total };
}
