import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerToSession, ensureDemoCustomer } from "@/lib/customerAuth";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export async function POST(request: Request) {
  try {
    await ensureDemoCustomer();

    const body = await request.json().catch(() => ({}));
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Заповни всі поля" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Введи коректний email" }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer?.password) {
      return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 409 });
    }

    const name = `${firstName} ${lastName}`.trim();

    const customer = existingCustomer
      ? await prisma.customer.update({
          where: { email },
          data: {
            name,
            password,
            photo: existingCustomer.photo || "/logo-pic.png"
          }
        })
      : await prisma.customer.create({
          data: {
            name,
            email,
            password,
            phone: "",
            city: "",
            address: "",
            photo: "/logo-pic.png"
          }
        });

    return NextResponse.json({
      user: customerToSession(customer)
    });
  } catch {
    return NextResponse.json({ error: "Помилка реєстрації" }, { status: 500 });
  }
}