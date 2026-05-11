"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import {
  getFullName,
  getSession,
  getUsers,
  normalizePhoto,
  normalizeSession,
  updateStoredUser
} from "@/lib/authStorage";
import type { SessionUser } from "@/lib/types";

function isValidPersonName(value: string) {
  return /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]{2,40}$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value: string) {
  if (!value) return true;
  return /^\+380\d{9}$/.test(value);
}

function isValidCity(value: string) {
  if (!value) return true;
  return /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]{2,60}$/.test(value);
}

function isValidAddress(value: string) {
  if (!value) return true;
  return value.length >= 5 && value.length <= 140 && /[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(value);
}

export default function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "user") {
      router.replace("/");
      return;
    }

    setUser(session);
  }, [router]);

  function showError(text: string) {
    setMessageType("error");
    setMessage(text);
  }

  function showSuccess(text: string) {
    setMessageType("success");
    setMessage(text);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const photo = normalizePhoto(String(formData.get("photo") || ""));

    if (!firstName || !lastName || !email) {
      showError("Ім’я, прізвище та email є обов’язковими");
      return;
    }

    if (!isValidPersonName(firstName)) {
      showError("Ім’я має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів");
      return;
    }

    if (!isValidPersonName(lastName)) {
      showError("Прізвище має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів");
      return;
    }

    if (!isValidEmail(email)) {
      showError("Введи коректний email, *****@gmail.com");
      return;
    }

    if (!isValidPhone(phone)) {
      showError("Телефон має бути у форматі +380XXXXXXXXX");
      return;
    }

    if (!isValidCity(city)) {
      showError("Місто має містити тільки літери, дефіс або апостроф");
      return;
    }

    if (!isValidAddress(address)) {
      showError("Адреса доставки має містити від 5 до 140 символів, наприклад Нова пошта, відділення №12");
      return;
    }

    const emailExists = getUsers().some((storedUser) => storedUser.role === "user" && storedUser.id !== user.id && storedUser.email === email);

    if (emailExists) {
      showError("Користувач з таким email вже існує");
      return;
    }

    const updatedUser = normalizeSession({
      ...user,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      photo,
      phone,
      city,
      address
    });

    if (!updatedUser) {
      showError("Не вдалося оновити профіль");
      return;
    }

    updateStoredUser(updatedUser);
    setUser(updatedUser);
    showSuccess("Профіль оновлено");
  }

  if (!user) {
  return (
    <div className="inline-loader">
      <img src="/logo-pic.png" alt="LUNÉ" />
      <p>Завантаження</p>
    </div>
  );
}

  return (
    <section className="page-section account-page">
      <div className="account-hero">
        <p className="eyebrow">Профіль</p>
        <h1>Дані користувача</h1>
        <p>Керуй особистою інформацією, контактами для доставки та фото профілю.</p>
      </div>

      <div className="account-layout">
        <aside className="account-side-card">
          <div className="profile-photo-preview">
            <img src={user.photo || "/logo-pic.png"} alt={getFullName(user)} />
          </div>
          <h2>{getFullName(user)}</h2>
          <p>{user.email}</p>
          <div className="profile-stars">✦ ✧ ✦</div>
        </aside>

        <form className="form-card account-form-card" onSubmit={saveProfile}>
          <div className="form-grid">
            <label>
              Ім’я
              <input name="firstName" required defaultValue={user.firstName} placeholder="Ім'я" />
            </label>

            <label>
              Прізвище
              <input name="lastName" required defaultValue={user.lastName} placeholder="Прізвище" />
            </label>

            <label>
              Email
              <input name="email" type="email" required defaultValue={user.email} placeholder="lune@gmail.com" />
            </label>

            <label>
              Телефон
              <input name="phone" defaultValue={user.phone} placeholder="+380*********" />
            </label>

            <label>
              Місто
              <input name="city" defaultValue={user.city} placeholder="Миколаїв" />
            </label>

            <label>
              Адреса доставки (Нова пошта)
              <input name="address" defaultValue={user.address} placeholder="відділення №*" />
            </label>

            <div className="wide profile-photo-field">
              <span className="profile-field-label">Фото профілю</span>
              <ProfileImageUpload name="photo" defaultValue={user.photo || "/logo-pic.png"} alt={getFullName(user)} />
            </div>
          </div>

          <div className="account-actions">
            <button className="btn btn-primary" type="submit">
              Зберегти зміни
            </button>

            {message && (
              <p className={`status-message profile-status-${messageType}`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}