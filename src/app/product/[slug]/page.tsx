import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ProductCardData } from "@/lib/types";

function serializeProduct(product: any): ProductCardData {
  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        include: { customer: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    include: { category: true },
    take: 3
  });

  const serialized = serializeProduct(product);

  return (
    <section className="page-section">
      <div className="product-page">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-detail-info">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="price-row big">
            <strong>{formatPrice(Number(product.price))}</strong>
            {product.oldPrice && <span>{formatPrice(Number(product.oldPrice))}</span>}
          </div>
          <div className="detail-list">
            <span>Матеріал: {product.material}</span>
            <span>Розмір: {product.size}</span>
            <span>Товщина: {product.gauge}</span>
            <span>Колір: {product.color}</span>
            <span>На складі: {product.stock}</span>
          </div>
          <AddToCartButton product={serialized} />
        </div>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Відгуки</p>
        <h2>Оцінки покупців</h2>
      </div>
      <div className="review-list">
        {product.reviews.length === 0 && <p className="muted">Поки що немає відгуків.</p>}
        {product.reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <strong>{review.customer.name}</strong>
            <span>{"★".repeat(review.rating)}</span>
            <p>{review.text}</p>
          </article>
        ))}
      </div>

      {related.length > 0 && (
        <>
          <div className="section-heading">
            <p className="eyebrow">Схожі товари</p>
            <h2>Може сподобатися</h2>
          </div>
          <div className="product-grid">
            {related.map((item) => <ProductCard key={item.id} product={serializeProduct(item)} />)}
          </div>
        </>
      )}
    </section>
  );
}
