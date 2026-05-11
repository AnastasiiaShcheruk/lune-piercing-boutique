import FavoritesClient from "@/components/FavoritesClient";

export default function FavoritesPage() {
  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">Обране</p>
        <h1>Товари, які сподобалися</h1>
        <p>Тут зберігаються прикраси, які користувач позначив сердечком у каталозі.</p>
      </div>
      <FavoritesClient />
    </section>
  );
}