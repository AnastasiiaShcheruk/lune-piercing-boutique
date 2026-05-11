import Link from "next/link";
import FooterAuthLink from "./FooterAuthLink";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-glow footer-glow-left" />
      <div className="footer-glow footer-glow-right" />

      <div className="footer-inner">
        <div className="footer-column footer-contacts">
          <p className="footer-title">Контакти</p>

          <div className="footer-info">
            <span>Телефон:</span>
            <p>+380 67 000 00 00</p>
          </div>

          <div className="footer-info">
            <span>Email:</span>
            <p>lune.piercing@gmail.com</p>
          </div>

          <div className="footer-socials">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              IG
            </a>
            <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
              TT
            </a>
          </div>
        </div>

        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <img src="/logo.png" alt="LUNÉ Piercing Boutique" />
          </Link>
        </div>

        <div className="footer-column footer-pages">
          <p className="footer-title">Сторінки</p>

          <div className="footer-links-grid">
            <div>
              <Link href="/">Головна</Link>
              <Link href="/catalog">Каталог</Link>
              <Link href="/favorites">Обране</Link>
              <Link href="/cart">Кошик</Link>
            </div>

            <div>
              <FooterAuthLink href="/profile" requiredRole="user">
                Профіль
              </FooterAuthLink>

              <FooterAuthLink href="/orders" requiredRole="user">
                Мої замовлення
              </FooterAuthLink>

              <FooterAuthLink href="/checkout" requiredRole="user">
                Оформлення
              </FooterAuthLink>

              <FooterAuthLink href="/admin" requiredRole="admin">
                Адмін-панель
              </FooterAuthLink>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-categories">
  <Link href="/catalog?category=piercing-earrings">Накрутки</Link>
  <Link href="/catalog?category=rings">Клікери</Link>
  <Link href="/catalog?category=labrets">Лабрети</Link>
  <Link href="/catalog?category=barbells">Штанги</Link>
  <Link href="/catalog?category=aftercare">Засоби для догляду</Link>
</div>

      <div className="footer-bottom">
        <p>© 2026 LUNÉ Piercing Boutique</p>
        <p>Прикраси для твоєї унікальної краси</p>
      </div>
    </footer>
  );
}