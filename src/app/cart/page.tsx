import CartClient from "@/components/CartClient";

export default function CartPage() {
  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">Кошик</p>
        <h1>Твоє замовлення</h1>
      </div>
      <CartClient />
    </section>
  );
}
