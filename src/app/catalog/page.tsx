import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { ProductCardData } from "@/lib/types";

function serializeProduct(product: any): ProductCardData {
  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  };
}

export default async function Catalog({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; sort?: string }> }) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({
    where: {
      category: params.category ? { slug: params.category } : undefined,
      OR: params.q
        ? [
            { name: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
            { material: { contains: params.q, mode: "insensitive" } }
          ]
        : undefined
    },
    include: { category: true },
    orderBy: params.sort === "priceAsc" ? { price: "asc" } : params.sort === "priceDesc" ? { price: "desc" } : { createdAt: "desc" }
  });

  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">Каталог</p>
        <h1>Товари для пірсингу</h1>
        <p>Фільтруй прикраси за категоріями, назвою та ціною.</p>
      </div>

      <form className="catalog-filters">
        <input name="q" defaultValue={params.q || ""} placeholder="Пошук за назвою або матеріалом" />
        <select name="category" defaultValue={params.category || ""}>
          <option value="">Усі категорії</option>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
        <select name="sort" defaultValue={params.sort || ""}>
          <option value="">Нові спочатку</option>
          <option value="priceAsc">Спочатку дешевші</option>
          <option value="priceDesc">Спочатку дорожчі</option>
        </select>
        <button className="btn btn-primary">Застосувати</button>
        <Link href="/catalog" className="btn btn-ghost">Скинути</Link>
      </form>

      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={serializeProduct(product)} />)}
      </div>
    </section>
  );
}
