"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { ProductCardData } from "@/lib/types";

function readFavorites() {
  const raw = window.localStorage.getItem("lune-favorites");
  if (!raw) return [] as number[];

  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [] as number[];
  }
}

function writeFavorites(favorites: number[]) {
  window.localStorage.setItem("lune-favorites", JSON.stringify(favorites));
  window.dispatchEvent(new Event("lune-favorites-updated"));
}

export default function FavoritesClient() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    const favorites = readFavorites();

    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const ids = favorites.join(",");
    const response = await fetch(`/api/products?ids=${ids}`);
    const data = (await response.json()) as ProductCardData[];

    const sorted = favorites
      .map((id) => data.find((product) => product.id === id))
      .filter(Boolean) as ProductCardData[];

    setProducts(sorted);
    setLoading(false);
  }

  function clearFavorites() {
    writeFavorites([]);
    setProducts([]);
  }

  useEffect(() => {
    loadFavorites();

    const update = () => loadFavorites();

    window.addEventListener("lune-favorites-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("lune-favorites-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (loading) {
    return (
      <div className="inline-loader">
        <div className="inline-loader-stars">✧ ✦ ✧</div>
        <img src="/logo-pic.png" alt="LUNÉ" />
        <img className="inline-loader-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <p>Завантаження</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state luxe-empty-state favorites-empty-state">
        <img className="luxe-empty-logo" src="/logo-pic.png" alt="LUNÉ" />
        <img className="luxe-empty-name" src="/name.png" alt="LUNÉ Piercing Boutique" />
        <h2>Обраних товарів поки немає</h2>
        <p>Натискай на серце у картках товарів, щоб зберігати прикраси, які сподобалися.</p>
        <Link className="btn btn-primary" href="/catalog">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="favorites-toolbar">
        <p>
          Збережено товарів: <strong>{products.length}</strong>
        </p>

        <button type="button" className="btn btn-ghost" onClick={clearFavorites}>
          Очистити обране
        </button>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}