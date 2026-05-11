"use client";

import { ProductCardData } from "@/lib/types";

function readCart() {
  if (typeof window === "undefined") return [] as { productId: number; quantity: number }[];
  const raw = window.localStorage.getItem("lune-cart");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as { productId: number; quantity: number }[];
  } catch {
    return [];
  }
}

function saveCart(cart: { productId: number; quantity: number }[]) {
  window.localStorage.setItem("lune-cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("lune-cart-updated"));
}

export default function AddToCartButton({ product }: { product: ProductCardData }) {
  function addToCart() {
    const cart = readCart();
    const existing = cart.find((item) => item.productId === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId: product.id, quantity: 1 });
    }

    saveCart(cart);
  }

  return (
    <button className="btn btn-primary" onClick={addToCart} disabled={product.stock <= 0}>
      {product.stock > 0 ? "Додати в кошик" : "Немає в наявності"}
    </button>
  );
}
