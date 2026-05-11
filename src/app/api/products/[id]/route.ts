import { NextRequest, NextResponse } from "next/server";
import type { Category, Product } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

type ProductWithCategory = Product & {
  category: Category;
};

function mapProduct(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    stock: product.stock,
    material: product.material,
    size: product.size,
    gauge: product.gauge,
    color: product.color,
    isNew: product.isNew,
    isPopular: product.isPopular,
    image: product.image,
    categoryId: product.categoryId,
    createdAt: product.createdAt.toISOString(),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    }
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = await request.json();

    const product = await prisma.product.update({
      where: {
        id: Number(id)
      },
      data: {
        name: String(payload.name || "").trim(),
        slug: String(payload.slug || "").trim(),
        description: String(payload.description || "").trim(),
        price: Number(payload.price || 0),
        oldPrice: payload.oldPrice === null || payload.oldPrice === "" ? null : Number(payload.oldPrice),
        stock: Number(payload.stock || 0),
        material: String(payload.material || "").trim(),
        size: String(payload.size || "").trim(),
        gauge: String(payload.gauge || "").trim(),
        color: String(payload.color || "").trim(),
        image: String(payload.image || "/logo-pic.png"),
        isNew: Boolean(payload.isNew),
        isPopular: Boolean(payload.isPopular),
        categoryId: Number(payload.categoryId)
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(mapProduct(product));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не вдалося оновити товар";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    await prisma.product.delete({
      where: {
        id: Number(id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не вдалося видалити товар";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}