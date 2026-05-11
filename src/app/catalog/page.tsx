import Link from "next/link";
import { Prisma } from "@prisma/client";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { ProductCardData } from "@/lib/types";

const PRODUCTS_PER_PAGE = 12;

function serializeProduct(product: any): ProductCardData {
  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null
  };
}

function createPageHref(params: { category?: string; q?: string; sort?: string }, page: number) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort) search.set("sort", params.sort);
  if (page > 1) search.set("page", String(page));

  const query = search.toString();

  return query ? `/catalog?${query}` : "/catalog";
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set<number>();

  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);
  pages.add(currentPage - 1);
  pages.add(currentPage + 1);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export default async function Catalog({
  searchParams
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;

  const q = params.q?.trim() || "";
  const category = params.category?.trim() || "";
  const sort = params.sort?.trim() || "";
  const requestedPage = Number(params.page || 1);
  const safeRequestedPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where: Prisma.ProductWhereInput = {
    category: category ? { slug: category } : undefined,
    OR: q
      ? [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { material: { contains: q, mode: "insensitive" } }
        ]
      : undefined
  };

  const orderBy =
    sort === "priceAsc"
      ? { price: "asc" as const }
      : sort === "priceDesc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [categories, totalProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(safeRequestedPage, totalPages);
  const skip = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy,
    skip,
    take: PRODUCTS_PER_PAGE
  });

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">Каталог</p>
        <h1>Товари для пірсингу</h1>
        <p>Фільтруй прикраси за категоріями, назвою та ціною.</p>
      </div>

      <form className="catalog-filters">
        <input name="q" defaultValue={q} placeholder="Пошук за назвою або матеріалом" />

        <select name="category" defaultValue={category}>
          <option value="">Усі категорії</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sort}>
          <option value="">Нові спочатку</option>
          <option value="priceAsc">Спочатку дешевші</option>
          <option value="priceDesc">Спочатку дорожчі</option>
        </select>

        <button className="btn btn-primary">Застосувати</button>
        <Link href="/catalog" className="btn btn-ghost">
          Скинути
        </Link>
      </form>

      <div className="catalog-result-info">
        <p>
          Знайдено товарів: <strong>{totalProducts}</strong>
        </p>
        {totalProducts > 0 && (
          <p>
            Сторінка <strong>{currentPage}</strong> з <strong>{totalPages}</strong>
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={serializeProduct(product)} />
          ))}
        </div>
      ) : (
        <div className="empty-state catalog-empty">
          <h2>Товарів не знайдено</h2>
          <p>Спробуй змінити пошуковий запит, категорію або сортування.</p>
          <Link href="/catalog" className="btn btn-primary">
            Показати всі товари
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Пагінація каталогу">
          {currentPage > 1 ? (
            <Link className="pagination-arrow" href={createPageHref({ category, q, sort }, currentPage - 1)}>
              ← Попередня
            </Link>
          ) : (
            <span className="pagination-arrow disabled">← Попередня</span>
          )}

          <div className="pagination-pages">
            {visiblePages.map((page, index) => {
              const previousPage = visiblePages[index - 1];
              const hasGap = previousPage && page - previousPage > 1;

              return (
                <span className="pagination-page-group" key={page}>
                  {hasGap && <span className="pagination-dots">...</span>}
                  {page === currentPage ? (
                    <span className="pagination-page active">{page}</span>
                  ) : (
                    <Link className="pagination-page" href={createPageHref({ category, q, sort }, page)}>
                      {page}
                    </Link>
                  )}
                </span>
              );
            })}
          </div>

          {currentPage < totalPages ? (
            <Link className="pagination-arrow" href={createPageHref({ category, q, sort }, currentPage + 1)}>
              Наступна →
            </Link>
          ) : (
            <span className="pagination-arrow disabled">Наступна →</span>
          )}
        </nav>
      )}
    </section>
  );
}