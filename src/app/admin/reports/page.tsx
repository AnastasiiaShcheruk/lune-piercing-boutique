import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ procedure?: string }> }) {
  const params = await searchParams;

  const categoryReport = await prisma.$queryRaw<Array<{ category_name: string; product_count: bigint; average_price: any; total_stock: bigint }>>`
    SELECT c.name AS category_name,
           COUNT(p.id) AS product_count,
           AVG(p.price) AS average_price,
           SUM(p.stock) AS total_stock
    FROM "Category" c
    LEFT JOIN "Product" p ON p."categoryId" = c.id
    GROUP BY c.id, c.name
    ORDER BY product_count DESC
  `;

  const expensiveProducts = await prisma.$queryRaw<Array<{ name: string; price: any; category_name: string; final_price: any }>>`
    SELECT p.name,
           p.price,
           c.name AS category_name,
           get_product_final_price(p.id) AS final_price
    FROM "Product" p
    INNER JOIN "Category" c ON c.id = p."categoryId"
    WHERE p.price > (SELECT AVG(price) FROM "Product")
    ORDER BY p.price DESC
  `;

  let procedureResult: Array<{ created_order_id: number | null; result_status: string | null }> = [];

  if (params.procedure === "run") {
    const product = await prisma.product.findFirst({ where: { stock: { gt: 0 } }, orderBy: { id: "asc" } });

    if (product) {
      const items = JSON.stringify([{ productId: product.id, quantity: 1 }]).replace(/'/g, "''");
      procedureResult = await prisma.$queryRawUnsafe(
        `CALL create_order_from_json('Procedure Demo', 'procedure@lune.local', '+380000000000', 'Миколаїв', 'Demo address', '${items}'::jsonb, NULL, NULL)`
      );
    }
  }

  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">NativeSQL</p>
        <h1>Звіти та процедура</h1>
        <p>На сторінці використано JOIN, GROUP BY, вкладений підзапит, SQL-функцію та виклик збереженої процедури.</p>
      </div>

      <div className="table-card">
        <h2>Звіт за категоріями</h2>
        <table>
          <thead><tr><th>Категорія</th><th>Кількість товарів</th><th>Середня ціна</th><th>Залишок</th></tr></thead>
          <tbody>
            {categoryReport.map((row) => (
              <tr key={row.category_name}>
                <td>{row.category_name}</td>
                <td>{Number(row.product_count)}</td>
                <td>{formatPrice(Number(row.average_price || 0))}</td>
                <td>{Number(row.total_stock || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <h2>Товари дорожчі за середню ціну</h2>
        <table>
          <thead><tr><th>Товар</th><th>Категорія</th><th>Ціна</th><th>Результат функції</th></tr></thead>
          <tbody>
            {expensiveProducts.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.category_name}</td>
                <td>{formatPrice(Number(row.price))}</td>
                <td>{formatPrice(Number(row.final_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-card">
        <h2>Виклик збереженої процедури</h2>
        <p>Кнопка створює тестове замовлення через процедуру create_order_from_json.</p>
        <a className="btn btn-primary" href="/admin/reports?procedure=run">Викликати процедуру</a>
        {procedureResult.length > 0 && <p className="status-message">Статус: {procedureResult[0].result_status}, ID замовлення: {procedureResult[0].created_order_id}</p>}
      </div>
    </section>
  );
}
