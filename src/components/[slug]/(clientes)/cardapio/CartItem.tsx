import type { CartItem } from "@/types/supabase";

export function CartItem({
  item,
  onAdd,
  onRemove,
}: {
  item: CartItem;
  onAdd: (item: CartItem) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <span>{item.name}</span>
      <button onClick={() => onRemove(item.id)}>-</button>
      <span>{item.quantity}</span>
      <button onClick={() => onAdd(item)}>+</button>
    </div>
  );
}
