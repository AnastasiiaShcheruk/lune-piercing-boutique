"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFullName, getSession, normalizeSession, updateStoredUser } from "@/lib/authStorage";
import type { CartItem, SessionUser } from "@/lib/types";

type DeliveryMethod = "branch" | "postomat";
type PaymentMethod = "card" | "cash";

type CustomerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
};

const emptyCustomer: CustomerForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  address: ""
};

function readCart() {
  const raw = window.localStorage.getItem("lune-cart");
  if (!raw) return [] as CartItem[];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [] as CartItem[];
  }
}

function clearDeliveryPrefix(value: string) {
  return String(value || "")
    .replace(/^Відділення Нової пошти:\s*/i, "")
    .replace(/^Поштомат Нової пошти:\s*/i, "")
    .trim();
}

function updateStoredCustomer(customer: CustomerForm) {
  const session = getSession();

  if (!session || session.role !== "user") return;

  const updatedSession = normalizeSession({
    ...session,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    address: customer.address
  });

  if (!updatedSession) return;

  updateStoredUser(updatedSession);
}

function openAuthPopup() {
  window.dispatchEvent(new Event("lune-open-auth"));
}

function isValidName(value: string) {
  return /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]{2,40}$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+380\d{9}$/.test(value);
}

function isValidCity(value: string) {
  return /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]{2,60}$/.test(value);
}

function isValidDeliveryAddress(value: string) {
  return value.length >= 3 && value.length <= 120 && /\d/.test(value);
}

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("branch");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const deliveryTitle = deliveryMethod === "branch" ? "Відділення Нової пошти" : "Поштомат Нової пошти";
  const deliveryPlaceholder =
    deliveryMethod === "branch"
      ? "відділення №12"
      : "поштомат №2456";

  useEffect(() => {
    function loadState() {
      const currentSession = getSession();

      setItems(readCart());
      setSession(currentSession);

      if (currentSession && currentSession.role === "user") {
        const savedAddress = currentSession.address || "";

        setDeliveryMethod(savedAddress.toLowerCase().includes("поштомат") ? "postomat" : "branch");

        setCustomer({
          firstName: currentSession.firstName || "",
          lastName: currentSession.lastName || "",
          email: currentSession.email || "",
          phone: currentSession.phone || "",
          city: currentSession.city || "",
          address: clearDeliveryPrefix(savedAddress)
        });
      }
    }

    loadState();

    window.addEventListener("lune-auth-updated", loadState);
    window.addEventListener("lune-cart-updated", loadState);
    window.addEventListener("storage", loadState);

    return () => {
      window.removeEventListener("lune-auth-updated", loadState);
      window.removeEventListener("lune-cart-updated", loadState);
      window.removeEventListener("storage", loadState);
    };
  }, []);

  function changeCustomer(field: keyof CustomerForm, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function changeDeliveryMethod(value: DeliveryMethod) {
    setDeliveryMethod(value);
    setCustomer((current) => ({ ...current, address: "" }));
  }

  async function submitOrder(formData: FormData) {
    if (!session || session.role !== "user") {
      setMessage("Для оформлення замовлення потрібно увійти в акаунт користувача");
      return;
    }

    setMessage("");

    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const comment = String(formData.get("comment") || "").trim();
    const selectedDelivery = String(formData.get("deliveryMethod") || "branch") as DeliveryMethod;
    const selectedPayment = String(formData.get("paymentMethod") || "card") as PaymentMethod;
    const currentDeliveryTitle = selectedDelivery === "postomat" ? "Поштомат Нової пошти" : "Відділення Нової пошти";
    const currentPaymentTitle = selectedPayment === "cash" ? "Оплата при отриманні" : "Оплата на картку";
    const fullAddress = `${currentDeliveryTitle}: ${address}`;
    const fullComment = comment
      ? `Спосіб оплати: ${currentPaymentTitle}. Коментар: ${comment}`
      : `Спосіб оплати: ${currentPaymentTitle}`;

    if (!isValidName(firstName)) {
      setMessage("Ім’я має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів");
      return;
    }

    if (!isValidName(lastName)) {
      setMessage("Прізвище має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Введи коректний email, наприклад lune@gmail.com");
      return;
    }

    if (!isValidPhone(phone)) {
      setMessage("Телефон має бути у форматі +380XXXXXXXXX");
      return;
    }

    if (!isValidCity(city)) {
      setMessage("Місто має містити тільки літери, дефіс або апостроф");
      return;
    }

    if (!isValidDeliveryAddress(address)) {
      setMessage(
        selectedDelivery === "postomat"
          ? "Вкажи номер поштомата Нової пошти, наприклад поштомат №2456"
          : "Вкажи номер відділення Нової пошти, наприклад відділення №12"
      );
      return;
    }

    if (items.length === 0) {
      setMessage("Кошик порожній");
      return;
    }

    setLoading(true);

    const payload = {
      customer: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        city,
        address: fullAddress
      },
      comment: fullComment,
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

    updateStoredCustomer({
      firstName,
      lastName,
      email,
      phone,
      city,
      address: fullAddress
    });

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
        <p>Додай прикраси до кошика, щоб перейти до оформлення замовлення.</p>
        <Link className="btn btn-primary" href="/catalog">
          Повернутися в каталог
        </Link>
      </div>
    );
  }

  if (!session || session.role !== "user") {
    return (
      <div className="checkout-auth-required">
        <div className="auth-required-card">
          <div className="auth-required-icon">✦ ♡ ✧</div>
          <p className="eyebrow">Авторизація</p>
          <h2>Увійди, щоб оформити замовлення</h2>
          <p>
            Товари вже збережені у кошику. Після входу або реєстрації вони залишаться на місці, і ти зможеш завершити покупку.
          </p>

          <div className="auth-required-summary">
            <span>У кошику</span>
            <strong>{items.length} товарів</strong>
          </div>

          <div className="auth-required-actions">
            <button type="button" className="btn btn-primary" onClick={openAuthPopup}>
              Увійти або зареєструватися
            </button>
            <Link className="btn btn-ghost" href="/cart">
              Повернутися до кошика
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card checkout-form-card" action={submitOrder}>
      <div className="checkout-user-note">
        <span>✦</span>
        <p>
          Замовлення оформлюється для користувача <strong>{getFullName(session)}</strong>
        </p>
      </div>

      <div className="form-grid">
        <label>
          Ім’я
          <input
            name="firstName"
            required
            value={customer.firstName}
            placeholder="Ім'я"
            onChange={(event) => changeCustomer("firstName", event.target.value)}
          />
        </label>

        <label>
          Прізвище
          <input
            name="lastName"
            required
            value={customer.lastName}
            placeholder="Прізвище"
            onChange={(event) => changeCustomer("lastName", event.target.value)}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            required
            value={customer.email}
            placeholder="lune@gmail.com"
            onChange={(event) => changeCustomer("email", event.target.value)}
          />
        </label>

        <label>
          Телефон
          <input
            name="phone"
            required
            value={customer.phone}
            placeholder="+380*********"
            onChange={(event) => changeCustomer("phone", event.target.value)}
          />
        </label>

        <label>
          Місто
          <input
            name="city"
            required
            value={customer.city}
            placeholder="Миколаїв"
            onChange={(event) => changeCustomer("city", event.target.value)}
          />
        </label>

        <div className="checkout-delivery wide">
          <span className="checkout-delivery-title">Спосіб доставки</span>

          <div className="checkout-delivery-options">
            <label className={deliveryMethod === "branch" ? "active" : ""}>
              <input
                type="radio"
                name="deliveryMethod"
                value="branch"
                checked={deliveryMethod === "branch"}
                onChange={() => changeDeliveryMethod("branch")}
              />
              <span>Відділення</span>
            </label>

            <label className={deliveryMethod === "postomat" ? "active" : ""}>
              <input
                type="radio"
                name="deliveryMethod"
                value="postomat"
                checked={deliveryMethod === "postomat"}
                onChange={() => changeDeliveryMethod("postomat")}
              />
              <span>Поштомат</span>
            </label>
          </div>
        </div>

        <label className="wide">
          {deliveryTitle}
          <input
            name="address"
            required
            value={customer.address}
            placeholder={deliveryPlaceholder}
            onChange={(event) => changeCustomer("address", event.target.value)}
          />
        </label>

        <div className="checkout-delivery wide">
          <span className="checkout-delivery-title">Спосіб оплати</span>

          <div className="checkout-delivery-options">
            <label className={paymentMethod === "card" ? "active" : ""}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              <span>Оплата на картку</span>
            </label>

            <label className={paymentMethod === "cash" ? "active" : ""}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />
              <span>При отриманні</span>
            </label>
          </div>
        </div>

        <label className="wide">
          Коментар
          <textarea
            name="comment"
            rows={4}
            placeholder="Зателефонувати перед відправкою або уточнення щодо замовлення"
          />
        </label>
      </div>

      <button className="btn btn-primary" disabled={loading || items.length === 0}>
        {loading ? "Створення..." : "Підтвердити замовлення"}
      </button>

      {message && <p className="status-message">{message}</p>}
    </form>
  );
}