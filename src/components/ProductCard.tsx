import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/format";
import { ProductCardData } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>
      <div className="product-tags">
        {product.isNew && <span>Новинка</span>}
        {product.isPopular && <span>Популярне</span>}
      </div>
      <Link href={`/product/${product.slug}`} className="product-title">
        {product.name}
      </Link>
      <p>{product.category.name}</p>
      <div className="product-meta">
        <span>{product.material}</span>
        <span>{product.size}</span>
        <span>{product.gauge}</span>
      </div>
      <div className="price-row">
        <strong>{formatPrice(product.price)}</strong>
        {product.oldPrice && <span>{formatPrice(product.oldPrice)}</span>}
      </div>
      <AddToCartButton product={product} />
    </article>
  );
}
