import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminPage() {
  const [products, categories, orders] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const total = await prisma.order.aggregate({ _sum: { total: true } });

  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">Адмін-панель</p>
        <h1>Керування LUNÉ</h1>
      </div>
      <div className="admin-grid">
        <Link href="/admin/products" className="admin-card"><span>{products}</span><h2>Товари</h2></Link>
        <Link href="/admin/categories" className="admin-card"><span>{categories}</span><h2>Категорії</h2></Link>
        <Link href="/admin/reports" className="admin-card"><span>{formatPrice(Number(total._sum.total || 0))}</span><h2>Звіти</h2></Link>
      </div>
      <div className="table-card">
        <h2>Останні замовлення</h2>
        <table>
          <thead><tr><th>Номер</th><th>Клієнт</th><th>Статус</th><th>Сума</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.number}</td>
                <td>{order.customer.name}</td>
                <td>{order.status}</td>
                <td>{formatPrice(Number(order.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
