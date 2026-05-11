import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerToSession } from "@/lib/customerAuth";

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const id = Number(body.id);
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();
    const photo = String(body.photo || "/logo-pic.png").trim() || "/logo-pic.png";

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Не вдалося визначити користувача" }, { status: 400 });
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Ім’я, прізвище та email є обов’язковими" }, { status: 400 });
    }

    if (!isValidPersonName(firstName)) {
      return NextResponse.json({ error: "Ім’я має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів" }, { status: 400 });
    }

    if (!isValidPersonName(lastName)) {
      return NextResponse.json({ error: "Прізвище має містити тільки літери, дефіс або апостроф і бути від 2 до 40 символів" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Введи коректний email, *****@gmail.com" }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Телефон має бути у форматі +380XXXXXXXXX" }, { status: 400 });
    }

    if (!isValidCity(city)) {
      return NextResponse.json({ error: "Місто має містити тільки літери, дефіс або апостроф" }, { status: 400 });
    }

    if (!isValidAddress(address)) {
      return NextResponse.json({ error: "Адреса доставки має містити від 5 до 140 символів, наприклад Нова пошта, відділення №12" }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer && existingCustomer.id !== id) {
      return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 409 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        city,
        address,
        photo
      }
    });

    return NextResponse.json({
      user: customerToSession(customer)
    });
  } catch {
    return NextResponse.json({ error: "Не вдалося оновити профіль" }, { status: 500 });
  }
}