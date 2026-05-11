"use client";

import { useEffect, useState } from "react";

function readFavorites() {
  if (typeof window === "undefined") return [] as number[];
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

export default function FavoriteButton({ productId, productName }: { productId: number; productName: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(readFavorites().includes(productId));
    update();
    window.addEventListener("lune-favorites-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("lune-favorites-updated", update);
      window.removeEventListener("storage", update);
    };
  }, [productId]);

  function toggleFavorite() {
    const favorites = readFavorites();
    const nextFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    writeFavorites(nextFavorites);
    setActive(nextFavorites.includes(productId));
  }

  return (
    <button
      type="button"
      className={active ? "favorite-button active" : "favorite-button"}
      onClick={toggleFavorite}
      aria-label={active ? `Прибрати ${productName} з обраного` : `Додати ${productName} до обраного`}
      title={active ? "В обраному" : "Додати до обраного"}
    >
      <span className="favorite-star favorite-star-left">✦</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7.1-4.4-9.6-8.8C.4 8.7 2.4 4.5 6.5 4.5c2.2 0 3.7 1.2 4.5 2.4.8-1.2 2.3-2.4 4.5-2.4 4.1 0 6.1 4.2 4.1 7.7C19.1 16.6 12 21 12 21Z" />
      </svg>
      <span className="favorite-star favorite-star-right">✧</span>
    </button>
  );
}