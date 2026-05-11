import { notFound } from "next/navigation";
import Link from "next/link";
import { Category, Customer, Product, Review } from "@prisma/client";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteButton from "@/components/FavoriteButton";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { ProductCardData } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProductWithCategory = Product & {
  category: Category;
};

type ProductWithReviews = Product & {
  category: Category;
  reviews: Array<Review & { customer: Customer }>;
};

function serializeProduct(product: ProductWithCategory): ProductCardData {
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
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    }
  };
}

async function findProduct(slugOrId: string) {
  const productId = Number(slugOrId);
  const isId = Number.isInteger(productId) && productId > 0;

  return prisma.product.findFirst({
    where: isId ? { id: productId } : { slug: slugOrId },
    include: {
      category: true,
      reviews: {
        include: {
          customer: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);

  if (!product) {
    return {
      title: "Товар не знайдено | LUNÉ"
    };
  }

  return {
    title: `${product.name} | LUNÉ Piercing Boutique`,
    description: product.description
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = (await findProduct(slug)) as ProductWithReviews | null;

  if (!product) {
    notFound();
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: {
        not: product.id
      }
    },
    include: {
      category: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 3
  });

  const serialized = serializeProduct(product);

  return (
    <section className="page-section">
      <div className="breadcrumbs">
  <Link href="/">Головна</Link>
  <span>/</span>
  <Link href="/catalog">Каталог</Link>
  <span>/</span>
  <Link href={`/catalog?category=${product.category.slug}`}>
    {product.category.name}
  </Link>
  <span>/</span>
  <span>{product.name}</span>
</div>

      <div className="product-page">
        <div className="product-detail-image">
          <FavoriteButton productId={product.id} productName={product.name} />
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
  {product.category.name.toLowerCase().includes("догляд") ? (
    <>
      <span>Об’єм: {product.size}</span>
      <span>На складі: {product.stock}</span>
    </>
  ) : (
    <>
      <span>Матеріал: {product.material}</span>
      <span>Розмір: {product.size}</span>
      <span>Товщина: {product.gauge}</span>
      <span>Колір: {product.color}</span>
      <span>На складі: {product.stock}</span>
    </>
  )}
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
            {related.map((item) => (
              <ProductCard key={item.id} product={serializeProduct(item)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}