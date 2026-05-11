import CheckoutClient from "@/components/CheckoutClient";

export default function CheckoutPage() {
  return (
    <section className="page-section narrow">
      <div className="section-heading center">
        <p className="eyebrow">Оформлення</p>
        <h1>Дані покупця</h1>
      </div>
      <CheckoutClient />
    </section>
  );
}
