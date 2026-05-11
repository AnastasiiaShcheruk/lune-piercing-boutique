"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminImageUpload from "./AdminImageUpload";

type CategoryOption = {
  id: number;
  name: string;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  material: string;
  size: string;
  gauge: string;
  color: string;
  isNew: boolean;
  isPopular: boolean;
  image: string;
  categoryId: number;
  category: {
    name: string;
  };
};

function formatAdminPrice(price: number) {
  const value = Math.round(Number(price) || 0);
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} грн`;
}

function isCareCategory(name?: string) {
  return String(name || "").toLowerCase().includes("догляд");
}

function getNumberValue(value: string) {
  const match = String(value || "").replace(",", ".").match(/\d+(\.\d+)?/);
  return match ? match[0] : "";
}

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

const emptyProduct: AdminProduct = {
  id: 0,
  name: "",
  slug: "",
  description: "",
  price: 0,
  oldPrice: null,
  stock: 0,
  material: "",
  size: "",
  gauge: "",
  color: "",
  isNew: false,
  isPopular: false,
  image: "/logo-pic.png",
  categoryId: 0,
  category: {
    name: ""
  }
};

export default function AdminProductsClient({
  initialProducts,
  categories
}: {
  initialProducts: AdminProduct[];
  categories: CategoryOption[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(editingProduct?.categoryId || 0);

  const currentProduct = editingProduct || emptyProduct;
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || categories.find((category) => category.id === currentProduct.categoryId);
  const selectedIsCare = isCareCategory(selectedCategory?.name);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalized) ||
        product.category.name.toLowerCase().includes(normalized) ||
        product.material.toLowerCase().includes(normalized)
      );
    });
  }, [products, query]);

  async function reloadProducts() {
    const response = await fetch("/api/products");
    const data = await response.json();

    if (response.ok) {
      setProducts(data);
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const categoryId = Number(formData.get("categoryId") || 0);
    const category = categories.find((item) => item.id === categoryId);
    const careProduct = isCareCategory(category?.name);
    const price = Number(formData.get("price") || 0);
    const stock = Number(formData.get("stock") || 0);
    const image = String(formData.get("image") || "/logo-pic.png");
    const manualSlug = String(formData.get("slug") || "").trim();
    const baseSlug = slugify(name) || "product";

    if (!name) {
      setMessage("Введи назву товару");
      return;
    }

    if (!categoryId) {
      setMessage("Обери категорію товару");
      return;
    }

    if (!price || price <= 0) {
      setMessage("Введи коректну ціну товару");
      return;
    }

    if (stock < 0) {
      setMessage("Кількість товару не може бути від’ємною");
      return;
    }

    let material = String(formData.get("material") || "").trim();
    let size = "";
    let gauge = "";
    let color = String(formData.get("color") || "").trim();

    if (careProduct) {
      const volumeMl = Number(formData.get("volumeMl") || 0);

      if (!volumeMl || volumeMl <= 0) {
        setMessage("Введи об’єм засобу для догляду в мл");
        return;
      }

      material = "Засіб для догляду";
      size = `${volumeMl} мл`;
      gauge = "Об’єм";
      color = "Не застосовується";
    } else {
      const sizeMm = Number(formData.get("sizeMm") || 0);
      const gaugeMm = Number(formData.get("gaugeMm") || 0);

      if (!material || !color) {
        setMessage("Заповни матеріал і колір");
        return;
      }

      if (!sizeMm || sizeMm <= 0) {
        setMessage("Введи розмір товару в мм");
        return;
      }

      if (!gaugeMm || gaugeMm <= 0) {
        setMessage("Введи товщину товару в мм");
        return;
      }

      size = `${sizeMm} мм`;
      gauge = `${gaugeMm} мм`;
    }

    const slug = manualSlug || (editingProduct ? `${baseSlug}-${editingProduct.id}` : `${baseSlug}-${Date.now()}`);

    const payload = {
      name,
      slug,
      description: description || "",
      price,
      oldPrice: String(formData.get("oldPrice") || "").trim() ? Number(formData.get("oldPrice")) : null,
      stock,
      material,
      size,
      gauge,
      color,
      image,
      isNew: formData.get("isNew") === "on",
      isPopular: formData.get("isPopular") === "on",
      categoryId
    };

    const response = await fetch(editingProduct ? `/api/products/${editingProduct.id}` : "/api/products", {
      method: editingProduct ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Не вдалося зберегти товар");
      return;
    }

    await reloadProducts();

    setEditingProduct(null);
    setSelectedCategoryId(0);
    setFormVersion((current) => current + 1);
    setMessage(editingProduct ? "Товар оновлено" : "Товар додано");
  }

  async function deleteProduct(productId: number) {
    const confirmed = window.confirm("Видалити товар?");

    if (!confirmed) return;

    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Не вдалося видалити товар");
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== productId));
    setMessage("Товар видалено");
  }

  function startCreate() {
    setEditingProduct(null);
    setSelectedCategoryId(0);
    setMessage("");
    setFormVersion((current) => current + 1);
  }

  function startEdit(product: AdminProduct) {
    setEditingProduct(product);
    setSelectedCategoryId(product.categoryId);
    setMessage("");
    setFormVersion((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="page-section admin-products-page">
      <div className="section-heading center">
        <p className="eyebrow">Адмін-панель</p>
        <h1>Керування товарами</h1>
      </div>

      <div className="admin-editor-layout">
        <form key={`${editingProduct?.id || "new"}-${formVersion}`} className="form-card admin-product-form" onSubmit={submitProduct}>
          <div className="admin-form-head">
            <div>
              <p className="eyebrow">{editingProduct ? "Редагування" : "Новий товар"}</p>
              <h2>{editingProduct ? editingProduct.name : "Додати товар"}</h2>
            </div>

            {editingProduct && (
              <button type="button" className="btn btn-ghost" onClick={startCreate}>
                Скасувати
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Назва
              <input name="name" required defaultValue={currentProduct.name} placeholder="Титановий лабрет Luna" />
            </label>

            <label>
              Slug
              <input name="slug" defaultValue={currentProduct.slug} placeholder="Можна залишити порожнім" />
            </label>

            <label>
              Ціна
              <input name="price" type="number" min="1" step="1" required defaultValue={currentProduct.price || ""} placeholder="450" />
            </label>

            <label>
              Стара ціна
              <input name="oldPrice" type="number" min="0" step="1" defaultValue={currentProduct.oldPrice || ""} placeholder="520" />
            </label>

            <label>
              Кількість
              <input name="stock" type="number" min="0" step="1" required defaultValue={currentProduct.stock || ""} placeholder="25" />
            </label>

            <label>
              Категорія
              <select
                name="categoryId"
                required
                value={selectedCategoryId || ""}
                onChange={(event) => setSelectedCategoryId(Number(event.target.value))}
              >
                <option value="">Обери категорію</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedIsCare ? (
              <label>
                Об’єм, мл
                <input
                  name="volumeMl"
                  type="number"
                  min="1"
                  step="1"
                  required
                  defaultValue={getNumberValue(currentProduct.size)}
                  placeholder="100"
                />
              </label>
            ) : (
              <>
                <label>
                  Матеріал
                  <input name="material" required defaultValue={currentProduct.material} placeholder="Титан" />
                </label>

                <label>
                  Колір
                  <input name="color" required defaultValue={currentProduct.color} placeholder="Срібний" />
                </label>

                <label>
                  Розмір, мм
                  <input
                    name="sizeMm"
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    defaultValue={getNumberValue(currentProduct.size)}
                    placeholder="8"
                  />
                </label>

                <label>
                  Товщина, мм
                  <input
                    name="gaugeMm"
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    defaultValue={getNumberValue(currentProduct.gauge)}
                    placeholder="1.2"
                  />
                </label>
              </>
            )}

            <div className="wide admin-image-field">
              <span className="admin-field-label">Зображення</span>
              <AdminImageUpload name="image" defaultValue={currentProduct.image} />
            </div>

            <label className="admin-checkbox">
              <input name="isNew" type="checkbox" defaultChecked={currentProduct.isNew} />
              <span>Новинка</span>
            </label>

            <label className="admin-checkbox">
              <input name="isPopular" type="checkbox" defaultChecked={currentProduct.isPopular} />
              <span>Популярний товар</span>
            </label>

            <label className="wide">
              Опис
              <textarea name="description" rows={5} defaultValue={currentProduct.description} placeholder="Можна залишити порожнім" />
            </label>
          </div>

          <button className="btn btn-primary" type="submit">
            {editingProduct ? "Зберегти зміни" : "Додати товар"}
          </button>

          {message && <p className="status-message">{message}</p>}
        </form>

        <div className="admin-products-list">
          <div className="admin-products-list-head">
            <div>
              <p className="eyebrow">Товари</p>
              <h2>{products.length}</h2>
            </div>

            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук товару..." />
          </div>

          <div className="admin-product-items">
            {filteredProducts.map((product) => (
              <article className="admin-product-item" key={product.id}>
                <img src={product.image || "/logo-pic.png"} alt={product.name} />

                <div>
                  <h3>{product.name}</h3>
                  <p>{product.category.name}</p>
                  <span suppressHydrationWarning>{formatAdminPrice(product.price)}</span>
                </div>

                <div className="admin-product-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(product)}>
                    Редагувати
                  </button>

                  <button type="button" className="btn btn-ghost danger" onClick={() => deleteProduct(product.id)}>
                    Видалити
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}