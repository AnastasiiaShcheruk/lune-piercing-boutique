import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteButton from "@/components/FavoriteButton";
import { formatPrice } from "@/lib/format";
import { ProductCardData } from "@/lib/types";

function isCareCategory(name?: string) {
  return String(name || "").toLowerCase().includes("догляд");
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const careProduct = isCareCategory(product.category.name);

  return (
    <article className="product-card">
      <FavoriteButton productId={product.id} productName={product.name} />

      <Link href={`/product/${product.id}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>

      <div className="product-tags">
        {product.isNew && <span>Новинка</span>}
        {product.isPopular && <span>Популярне</span>}
      </div>

      <Link href={`/product/${product.id}`} className="product-title">
        {product.name}
      </Link>

      <p>{product.category.name}</p>

      <div className="product-meta">
        {careProduct ? (
          <span>Об’єм: {product.size}</span>
        ) : (
          <>
            <span>{product.material}</span>
            <span>{product.size}</span>
            <span>{product.gauge}</span>
          </>
        )}
      </div>

      <div className="price-row">
        <strong>{formatPrice(product.price)}</strong>
        {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
      </div>

      <AddToCartButton product={product} />
    </article>
  );
}