import Link from "next/link";
import CheckoutClient from "@/components/CheckoutClient";

export default function CheckoutPage() {
  return (
    <section className="page-section narrow checkout-page-section">
      <div className="section-heading center checkout-heading">
        <p className="eyebrow">Оформлення</p>
        <h1>Дані покупця</h1>
      </div>

      <div className="checkout-steps checkout-steps-two">
        <Link href="/cart" className="checkout-step done">
          <span>1</span>
          <p>Кошик</p>
        </Link>

        <div className="checkout-step active">
          <span>2</span>
          <p>Дані покупця</p>
        </div>
      </div>

      <CheckoutClient />
    </section>
  );
}