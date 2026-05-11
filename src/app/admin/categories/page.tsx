import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ie",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "i",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ю: "iu",
    я: "ia",
    ь: "",
    "'": "",
    "’": ""
  };

  return value
    .toLowerCase()
    .split("")
    .map((symbol) => map[symbol] ?? symbol)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

async function createUniqueSlug(name: string, currentId?: number) {
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: {
        slug
      }
    });

    if (!existing || existing.id === currentId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) return;

  const slug = await createUniqueSlug(name);

  await prisma.category.create({
    data: {
      name,
      slug,
      description: description || "Категорія товарів LUNÉ Piercing Boutique.",
      image: null
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

async function updateCategory(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!id || !name) return;

  const slug = await createUniqueSlug(name, id);

  await prisma.category.update({
    where: {
      id
    },
    data: {
      name,
      slug,
      description: description || "Категорія товарів LUNÉ Piercing Boutique.",
      image: null
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

async function deleteCategory(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!id) return;

  await prisma.category.delete({
    where: {
      id
    }
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return (
    <section className="page-section admin-categories-page">
      <div className="section-heading center">
        <p className="eyebrow">Адмін-панель</p>
        <h1>Категорії</h1>
        <p>Керування категоріями товарів для каталогу LUNÉ Piercing Boutique.</p>
      </div>

      <div className="admin-category-layout">
        <form className="form-card admin-category-form" action={createCategory}>
          <h2>Додати категорію</h2>

          <label>
            Назва
            <input name="name" required placeholder="Наприклад, Кільця" />
          </label>

          <label>
            Опис
            <textarea
              name="description"
              rows={5}
              placeholder="Наприклад, Стильні кільця для септуму, губ, вуха та інших видів пірсингу."
            />
          </label>

          <button className="btn btn-primary" type="submit">
            Додати
          </button>
        </form>

        <div className="admin-category-list">
          {categories.map((category) => (
            <article className="admin-category-card" key={category.id}>
              <form action={updateCategory}>
                <input type="hidden" name="id" value={category.id} />

                <div className="admin-category-card-head">
                  <div>
                    <p className="eyebrow">Категорія</p>
                    <h3>{category.name}</h3>
                    <span>{category._count.products} товарів</span>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Назва
                    <input name="name" required defaultValue={category.name} placeholder="Наприклад, Лабрети" />
                  </label>

                  <label className="wide">
                    Опис
                    <textarea
                      name="description"
                      rows={4}
                      defaultValue={category.description}
                      placeholder="Наприклад, Базові та декоративні лабрети для різних видів пірсингу."
                    />
                  </label>
                </div>

                <div className="admin-category-actions">
                  <button className="btn btn-primary" type="submit">
                    Зберегти
                  </button>

                  <button className="btn btn-ghost danger" formAction={deleteCategory}>
                    Видалити
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}