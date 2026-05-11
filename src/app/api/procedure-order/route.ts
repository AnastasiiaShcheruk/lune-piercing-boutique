import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const product = await prisma.product.findFirst({ where: { stock: { gt: 0 } }, orderBy: { id: "asc" } });

  if (!product) {
    return NextResponse.json({ error: "Немає товарів у наявності" }, { status: 400 });
  }

  const items = JSON.stringify([{ productId: product.id, quantity: 1 }]).replace(/'/g, "''");
  const result = await prisma.$queryRawUnsafe(
    `CALL create_order_from_json('Procedure Demo', 'procedure@lune.local', '+380000000000', 'Миколаїв', 'Demo address', '${items}'::jsonb, NULL, NULL)`
  );

  return NextResponse.json(result);
}
