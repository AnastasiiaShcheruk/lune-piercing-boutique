"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthMenu from "@/components/AuthMenu";
import CartBadge from "@/components/CartBadge";
import FavoritesBadge from "@/components/FavoritesBadge";

export default function Header() {
  const pathname = usePathname();

  function getLinkClass(path: string) {
    return pathname === path || pathname.startsWith(`${path}/`) ? "active" : "";
  }

  return (
    <header className="site-header">
      <Link className={pathname === "/" ? "brand active" : "brand"} href="/">
        <img src="/logo-pic.png" alt="LUNÉ" />
        <span>LUNÉ</span>
      </Link>

      <nav className="nav">
        <Link className={getLinkClass("/catalog")} href="/catalog">
          Каталог
        </Link>

        <Link className={getLinkClass("/favorites")} href="/favorites">
          Обране <FavoritesBadge />
        </Link>

        <Link className={getLinkClass("/cart")} href="/cart">
          Кошик <CartBadge />
        </Link>

        <AuthMenu />
      </nav>
    </header>
  );
}