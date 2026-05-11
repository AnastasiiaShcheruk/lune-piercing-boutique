import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OrderPayload = {
  customer: {
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
  };
  comment?: string;
  items: Array<{ productId: number; quantity: number }>;
};

function createOrderNumber() {
  return `LUNE-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as OrderPayload;

  if (!payload.items || payload.items.length === 0) {
    return NextResponse.json({ error: "Кошик порожній" }, { status: 400 });
  }

  if (!payload.customer.name || !payload.customer.email || !payload.customer.phone || !payload.customer.city || !payload.customer.address) {
    return NextResponse.json({ error: "Заповни всі обов’язкові поля" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: payload.customer.email },
        update: {
          name: payload.customer.name,
          phone: payload.customer.phone,
          city: payload.customer.city,
          address: payload.customer.address
        },
        create: payload.customer
      });

      const ids = payload.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: ids } } });

      for (const item of payload.items) {
        const product = products.find((current) => current.id === item.productId);
        if (!product) throw new Error("Товар не знайдено");
        if (item.quantity <= 0) throw new Error("Кількість має бути більшою за 0");
        if (product.stock < item.quantity) throw new Error(`Недостатньо товару: ${product.name}`);
      }

      const total = payload.items.reduce((sum, item) => {
        const product = products.find((current) => current.id === item.productId)!;
        return sum + Number(product.price) * item.quantity;
      }, 0);

      const createdOrder = await tx.order.create({
        data: {
          number: createOrderNumber(),
          customerId: customer.id,
          total,
          comment: payload.comment || null,
          items: {
            create: payload.items.map((item) => {
              const product = products.find((current) => current.id === item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
                lineTotal: Number(product.price) * item.quantity
              };
            })
          }
        }
      });

      for (const item of payload.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ id: order.id, number: order.number });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Помилка створення замовлення";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
