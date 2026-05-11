"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { CartItem, ProductCardData } from "@/lib/types";

type CartProduct = ProductCardData & { quantity: number };

function readCart() {
  const raw = window.localStorage.getItem("lune-cart");
  if (!raw) return [] as CartItem[];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  window.localStorage.setItem("lune-cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("lune-cart-updated"));
}

export default function CartClient() {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCart() {
    const cart = readCart();

    if (cart.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const ids = cart.map((item) => item.productId).join(",");
    const response = await fetch(`/api/products?ids=${ids}`);
    const products = (await response.json()) as ProductCardData[];

    const merged = products.map((product) => ({
      ...product,
      quantity: cart.find((item) => item.productId === product.id)?.quantity ?? 1
    }));

    setItems(merged);
    setLoading(false);
  }

  function setQuantity(productId: number, quantity: number) {
    const nextQuantity = Math.max(1, quantity);
    const nextItems = items.map((item) => (item.id === productId ? { ...item, quantity: nextQuantity } : item));

    setItems(nextItems);
    writeCart(nextItems.map((item) => ({ productId: item.id, quantity: item.quantity })));
  }

  function decreaseQuantity(productId: number, currentQuantity: number) {
    if (currentQuantity <= 1) return;
    setQuantity(productId, currentQuantity - 1);
  }

  function increaseQuantity(productId: number, currentQuantity: number) {
    setQuantity(productId, currentQuantity + 1);
  }

  function removeItem(productId: number) {
    const nextItems = items.filter((item) => item.id !== productId);

    setItems(nextItems);
    writeCart(nextItems.map((item) => ({ productId: item.id, quantity: item.quantity })));
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  useEffect(() => {
    loadCart();
  }, []);

  if (loading) {
    return (
      <div className="inline-loader">
        <div className="inline-loader-stars">✧ ✦ ✧</div>
        <img src="/logo-pic.png" alt="LUNÉ" />
        <img className="inline-loader-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <p>Завантаження</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state luxe-empty-state cart-empty-state">
        <img className="luxe-empty-logo" src="/logo-pic.png" alt="LUNÉ" />
        <img className="luxe-empty-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <h2>Кошик порожній</h2>
        <p>Додай прикраси з каталогу, щоб оформити замовлення.</p>
        <Link className="btn btn-primary" href="/catalog">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <section className="cart-layout">
      <div className="cart-list">
        {items.map((item) => (
          <article className="cart-row" key={item.id}>
            <img src={item.image} alt={item.name} />

            <div>
              <h3>{item.name}</h3>
              <p>{item.category.name}</p>
              <strong>{formatPrice(item.price)}</strong>
            </div>

            <div className="quantity-control">
              <button
                type="button"
                className="quantity-button"
                disabled={item.quantity <= 1}
                onClick={() => decreaseQuantity(item.id, item.quantity)}
              >
                −
              </button>

              <input type="number" min="1" value={item.quantity} readOnly />

              <button
                type="button"
                className="quantity-button"
                onClick={() => increaseQuantity(item.id, item.quantity)}
              >
                +
              </button>
            </div>

            <button type="button" className="btn btn-ghost cart-remove-button" onClick={() => removeItem(item.id)}>
              Видалити
            </button>
          </article>
        ))}
      </div>

      <aside className="summary-card">
        <h2>Разом</h2>
        <strong>{formatPrice(total)}</strong>
        <Link className="btn btn-primary" href="/checkout">
          Оформити замовлення
        </Link>
      </aside>
    </section>
  );
}