"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CartItem } from "@/lib/types";

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("lune-cart");
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  async function submitOrder(formData: FormData) {
    setLoading(true);
    setMessage("");

    const payload = {
      customer: {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        city: String(formData.get("city") || ""),
        address: String(formData.get("address") || "")
      },
      comment: String(formData.get("comment") || ""),
      items
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Помилка оформлення замовлення");
      setLoading(false);
      return;
    }

    window.localStorage.removeItem("lune-cart");
    window.dispatchEvent(new Event("lune-cart-updated"));
    setItems([]);
    setMessage(`Замовлення ${data.number} створено успішно`);
    setLoading(false);
  }

  if (items.length === 0 && !message) {
    return (
      <div className="empty-state">
        <h2>Немає товарів для оформлення</h2>
        <Link className="btn btn-primary" href="/catalog">Повернутися в каталог</Link>
      </div>
    );
  }

  return (
    <form className="form-card" action={submitOrder}>
      <div className="form-grid">
        <label>Ім’я<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Телефон<input name="phone" required /></label>
        <label>Місто<input name="city" required /></label>
        <label className="wide">Адреса<input name="address" required /></label>
        <label className="wide">Коментар<textarea name="comment" rows={4} /></label>
      </div>
      <button className="btn btn-primary" disabled={loading || items.length === 0}>{loading ? "Створення..." : "Підтвердити замовлення"}</button>
      {message && <p className="status-message">{message}</p>}
    </form>
  );
}
