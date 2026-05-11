import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import CartBadge from "@/components/CartBadge";
import FavoritesBadge from "@/components/FavoritesBadge";

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <img src="/logo-pic.png" alt="LUNÉ" />
        <span>LUNÉ</span>
      </Link>

      <nav className="nav">
        <Link href="/catalog">Каталог</Link>
        <Link href="/favorites">Обране <FavoritesBadge /></Link>
        <Link href="/cart">Кошик <CartBadge /></Link>
        <AuthMenu />
      </nav>
    </header>
  );
}