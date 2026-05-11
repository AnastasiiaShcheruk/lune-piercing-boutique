"use client";

import { useEffect, useState } from "react";

function getCount() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem("lune-cart");
  if (!raw) return 0;
  try {
    const cart = JSON.parse(raw) as { quantity: number }[];
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCount());
    update();
    window.addEventListener("lune-cart-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("lune-cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return <span className="cart-badge">{count}</span>;
}
