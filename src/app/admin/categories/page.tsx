import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "");

  await prisma.category.create({
    data: {
      name,
      slug: `${slugify(name)}-${Date.now()}`,
      description: String(formData.get("description") || ""),
      image: String(formData.get("image") || "/logo-pic.png")
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

async function updateCategory(formData: FormData) {
  "use server";

  await prisma.category.update({
    where: { id: Number(formData.get("id")) },
    data: {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      image: String(formData.get("image") || "/logo-pic.png")
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

async function deleteCategory(formData: FormData) {
  "use server";

  await prisma.category.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <section className="page-section narrow">
      <div className="section-heading center">
        <p className="eyebrow">CRUD</p>
        <h1>Керування категоріями</h1>
      </div>

      <form className="form-card" action={createCategory}>
        <h2>Додати категорію</h2>
        <div className="form-grid single">
          <label>Назва<input name="name" required /></label>
          <label>Зображення<input name="image" defaultValue="/logo-pic.png" /></label>
          <label>Опис<textarea name="description" rows={4} required /></label>
        </div>
        <button className="btn btn-primary">Додати</button>
      </form>

      <div className="admin-list">
        {categories.map((category) => (
          <article className="editable-card" key={category.id}>
            <form action={updateCategory}>
              <input type="hidden" name="id" value={category.id} />
              <div className="form-grid single">
                <label>Назва<input name="name" defaultValue={category.name} required /></label>
                <label>Зображення<input name="image" defaultValue={category.image || "/logo-pic.png"} /></label>
                <label>Опис<textarea name="description" rows={3} defaultValue={category.description} required /></label>
              </div>
              <div className="actions-row">
                <span>Товарів у категорії: {category._count.products}</span>
                <button className="btn btn-primary">Зберегти зміни</button>
              </div>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={category.id} />
              <button className="btn btn-ghost" disabled={category._count.products > 0}>Видалити категорію</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
