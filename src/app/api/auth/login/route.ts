import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerToSession, ensureDemoCustomer } from "@/lib/customerAuth";

export async function POST(request: Request) {
  try {
    await ensureDemoCustomer();

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Заповни email та пароль" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email }
    });

    if (!customer || customer.password !== password) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }

    return NextResponse.json({
      user: customerToSession(customer)
    });
  } catch {
    return NextResponse.json({ error: "Помилка авторизації" }, { status: 500 });
  }
}