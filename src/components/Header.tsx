import Link from "next/link";
import CartBadge from "@/components/CartBadge";

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <img src="/logo-pic.png" alt="LUNÉ" />
        <span>LUNÉ</span>
      </Link>
      <nav className="nav">
        <Link href="/catalog">Каталог</Link>
        <Link href="/cart">Кошик <CartBadge /></Link>
        <Link href="/admin">Адмін</Link>
      </nav>
    </header>
  );
}
