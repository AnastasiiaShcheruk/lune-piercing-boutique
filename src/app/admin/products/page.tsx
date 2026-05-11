import AdminProductsClient from "../../../components/AdminProductsClient";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc"
      }
    })
  ]);

  return (
    <AdminProductsClient
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name
      }))}
      initialProducts={products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
        stock: product.stock,
        material: product.material,
        size: product.size,
        gauge: product.gauge,
        color: product.color,
        isNew: product.isNew,
        isPopular: product.isPopular,
        image: product.image,
        categoryId: product.categoryId,
        category: {
          name: product.category.name
        }
      }))}
    />
  );
}