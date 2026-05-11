"use client";

import { useEffect, useState } from "react";

function getCount() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem("lune-favorites");
  if (!raw) return 0;
  try {
    const favorites = JSON.parse(raw) as number[];
    return favorites.length;
  } catch {
    return 0;
  }
}

export default function FavoritesBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getCount());
    update();
    window.addEventListener("lune-favorites-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("lune-favorites-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return <span className="favorites-badge">{count}</span>;
}