import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")
    ?.split(",")
    .map((id) => Number(id))
    .filter(Boolean) ?? [];

  const products = await prisma.product.findMany({
    where: ids.length > 0 ? { id: { in: ids } } : undefined,
    include: { category: true }
  });

  return NextResponse.json(products.map((product) => ({
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  })));
}
