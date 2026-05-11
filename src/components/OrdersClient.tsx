"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFullName, getSession } from "@/lib/authStorage";
import { formatPrice } from "@/lib/format";
import type { CustomerOrderData, SessionUser } from "@/lib/types";

const statusLabels: Record<string, string> = {
  NEW: "Нове",
  PAID: "Оплачене",
  SHIPPED: "Відправлене",
  COMPLETED: "Завершене",
  CANCELED: "Скасоване"
};

export default function OrdersClient() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<CustomerOrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = getSession();

    if (!sessionUser || sessionUser.role !== "user") {
      router.replace("/");
      return;
    }

    setUser(sessionUser);

    async function loadOrders(email: string) {
      const response = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      setOrders(response.ok ? data : []);
      setLoading(false);
    }

    loadOrders(sessionUser.email);
  }, [router]);

  if (!user) {
  return (
    <div className="inline-loader">
        <img src="/logo-pic.png" alt="LUNÉ" />
        <img className="inline-loader-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <p>Завантаження</p>
      </div>
  );
}

  return (
    <section className="page-section account-page">
      <div className="account-hero">
        <p className="eyebrow">Мої замовлення</p>
        <h1>Історія покупок</h1>
        <p>{getFullName(user)}, тут відображаються замовлення, оформлені на email {user.email}.</p>
      </div>

      {loading ? (
        <div className="inline-loader">
        <img src="/logo-pic.png" alt="LUNÉ" />
        <img className="inline-loader-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <p>Завантаження</p>
      </div>
      ) : orders.length === 0 ? (
        <div className="empty-state orders-empty-page">
          <h2>Замовлень поки немає</h2>
          <p>Додай товари в кошик та оформи замовлення, щоб воно з’явилося в особистому кабінеті.</p>
          <Link className="btn btn-primary" href="/catalog">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="orders-page-list">
          {orders.map((order) => (
            <article className="order-page-card" key={order.id}>
              <div className="order-head">
                <div>
                  <strong>{order.number}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString("uk-UA")}</span>
                </div>
                <span className={`order-status status-${order.status.toLowerCase()}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="order-products">
                {order.items.map((item) => (
                  <div className="order-product" key={item.id}>
                    <img src={item.product.image} alt={item.product.name} />
                    <div>
                      <Link href={`/product/${item.product.slug}`}>
                        {item.product.name}
                      </Link>
                      <span>{item.quantity} шт. × {formatPrice(item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total">
                <span>Разом</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}