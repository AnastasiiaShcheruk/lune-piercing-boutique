import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { formatPrice } from "@/lib/format";

async function createProduct(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "");

  await prisma.product.create({
    data: {
      name,
      slug: `${slugify(name)}-${Date.now()}`,
      description: String(formData.get("description") || ""),
      price: Number(formData.get("price") || 0),
      oldPrice: formData.get("oldPrice") ? Number(formData.get("oldPrice")) : null,
      stock: Number(formData.get("stock") || 0),
      material: String(formData.get("material") || ""),
      size: String(formData.get("size") || ""),
      gauge: String(formData.get("gauge") || ""),
      color: String(formData.get("color") || ""),
      isNew: formData.get("isNew") === "on",
      isPopular: formData.get("isPopular") === "on",
      image: String(formData.get("image") || "/logo-pic.png"),
      categoryId: Number(formData.get("categoryId"))
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

async function updateProduct(formData: FormData) {
  "use server";

  await prisma.product.update({
    where: { id: Number(formData.get("id")) },
    data: {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      price: Number(formData.get("price") || 0),
      oldPrice: formData.get("oldPrice") ? Number(formData.get("oldPrice")) : null,
      stock: Number(formData.get("stock") || 0),
      material: String(formData.get("material") || ""),
      size: String(formData.get("size") || ""),
      gauge: String(formData.get("gauge") || ""),
      color: String(formData.get("color") || ""),
      isNew: formData.get("isNew") === "on",
      isPopular: formData.get("isPopular") === "on",
      image: String(formData.get("image") || "/logo-pic.png"),
      categoryId: Number(formData.get("categoryId"))
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

async function deleteProduct(formData: FormData) {
  "use server";

  await prisma.product.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <section className="page-section">
      <div className="section-heading center">
        <p className="eyebrow">CRUD</p>
        <h1>Керування товарами</h1>
      </div>

      <form className="form-card" action={createProduct}>
        <h2>Додати товар</h2>
        <div className="form-grid">
          <label>Назва<input name="name" required /></label>
          <label>Ціна<input name="price" type="number" min="1" step="0.01" required /></label>
          <label>Стара ціна<input name="oldPrice" type="number" min="1" step="0.01" /></label>
          <label>Кількість<input name="stock" type="number" min="0" required /></label>
          <label>Матеріал<input name="material" required /></label>
          <label>Розмір<input name="size" required /></label>
          <label>Товщина<input name="gauge" required /></label>
          <label>Колір<input name="color" required /></label>
          <label>Зображення<input name="image" defaultValue="/logo-pic.png" required /></label>
          <label>Категорія<select name="categoryId" required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="check"><input name="isNew" type="checkbox" /> Новинка</label>
          <label className="check"><input name="isPopular" type="checkbox" /> Популярний</label>
          <label className="wide">Опис<textarea name="description" rows={4} required /></label>
        </div>
        <button className="btn btn-primary">Додати</button>
      </form>

      <div className="admin-list">
        {products.map((product) => (
          <article className="editable-card" key={product.id}>
            <form action={updateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <div className="form-grid">
                <label>Назва<input name="name" defaultValue={product.name} required /></label>
                <label>Ціна<input name="price" type="number" min="1" step="0.01" defaultValue={Number(product.price)} required /></label>
                <label>Стара ціна<input name="oldPrice" type="number" min="1" step="0.01" defaultValue={product.oldPrice ? Number(product.oldPrice) : ""} /></label>
                <label>Кількість<input name="stock" type="number" min="0" defaultValue={product.stock} required /></label>
                <label>Матеріал<input name="material" defaultValue={product.material} required /></label>
                <label>Розмір<input name="size" defaultValue={product.size} required /></label>
                <label>Товщина<input name="gauge" defaultValue={product.gauge} required /></label>
                <label>Колір<input name="color" defaultValue={product.color} required /></label>
                <label>Зображення<input name="image" defaultValue={product.image} required /></label>
                <label>Категорія<select name="categoryId" defaultValue={product.categoryId} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="check"><input name="isNew" type="checkbox" defaultChecked={product.isNew} /> Новинка</label>
                <label className="check"><input name="isPopular" type="checkbox" defaultChecked={product.isPopular} /> Популярний</label>
                <label className="wide">Опис<textarea name="description" rows={3} defaultValue={product.description} required /></label>
              </div>
              <div className="actions-row">
                <span>{formatPrice(Number(product.price))} · {product.category.name}</span>
                <button className="btn btn-primary">Зберегти зміни</button>
              </div>
            </form>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-ghost">Видалити товар</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
