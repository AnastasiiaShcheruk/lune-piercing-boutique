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

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isPopular: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 4
  });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Прикраси для твоєї унікальної краси</p>
          <h1>LUNÉ Piercing Boutique</h1>
          <p>Темний beauty-бутік для підбору стильних прикрас для пірсингу: кілець, лабретів, штанг, бананів та засобів для догляду.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/catalog">Переглянути каталог</Link>
            <Link className="btn btn-ghost" href="/admin">Адмін-панель</Link>
          </div>
        </div>
        <div className="hero-logo">
          <img src="/logo.png" alt="LUNÉ Piercing Boutique" />
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Категорії</p>
          <h2>Обери прикрасу під свій стиль</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link href={`/catalog?category=${category.slug}`} className="category-card" key={category.id}>
              <span>✦</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Популярні товари</p>
          <h2>Найбільше обирають</h2>
        </div>
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={serializeProduct(product)} />)}
        </div>
      </section>
    </>
  );
}
