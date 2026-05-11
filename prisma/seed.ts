import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Сережки для пірсингу",
    slug: "piercing-earrings",
    description: "Ніжні прикраси для щоденного образу та вечірнього стилю",
    image: "/logo-pic.png"
  },
  {
    name: "Кільця",
    slug: "rings",
    description: "Класичні та декоративні кільця для різних зон пірсингу",
    image: "/logo-pic.png"
  },
  {
    name: "Лабрети",
    slug: "labrets",
    description: "Зручні лабрети з металевим блиском та мінімалістичним дизайном",
    image: "/logo-pic.png"
  },
  {
    name: "Штанги",
    slug: "barbells",
    description: "Прикраси для брови, язика та інших видів пірсингу",
    image: "/logo-pic.png"
  },
  {
    name: "Засоби для догляду",
    slug: "aftercare",
    description: "Товари для безпечного догляду після процедури пірсингу",
    image: "/logo-pic.png"
  }
];

const products = [
  {
    name: "Silver Moon Clicker",
    slug: "silver-moon-clicker",
    description: "Сріблясте кільце-клікер з ніжним місячним блиском для стильного образу.",
    price: 620,
    oldPrice: 760,
    stock: 15,
    material: "Хірургічна сталь",
    size: "8 мм",
    gauge: "16G",
    color: "Срібний",
    isNew: true,
    isPopular: true,
    image: "/logo-pic.png",
    categorySlug: "rings"
  },
  {
    name: "Star Labret Stud",
    slug: "star-labret-stud",
    description: "Лабрет із маленькою зіркою, який гарно підходить для губи або вуха.",
    price: 390,
    oldPrice: null,
    stock: 24,
    material: "Титан",
    size: "6 мм",
    gauge: "16G",
    color: "Срібний",
    isNew: true,
    isPopular: false,
    image: "/name.png",
    categorySlug: "labrets"
  },
  {
    name: "Black Crystal Barbell",
    slug: "black-crystal-barbell",
    description: "Темна штанга з кристалічним акцентом для контрастного образу.",
    price: 480,
    oldPrice: 540,
    stock: 12,
    material: "Хірургічна сталь",
    size: "10 мм",
    gauge: "14G",
    color: "Чорний",
    isNew: false,
    isPopular: true,
    image: "/name-full.png",
    categorySlug: "barbells"
  },
  {
    name: "Soft Pearl Nose Stud",
    slug: "soft-pearl-nose-stud",
    description: "Акуратна прикраса для носа з перлинним елементом у ніжній естетиці LUNÉ.",
    price: 340,
    oldPrice: null,
    stock: 30,
    material: "Титан",
    size: "2 мм",
    gauge: "18G",
    color: "Перлинний",
    isNew: true,
    isPopular: true,
    image: "/logo-pic.png",
    categorySlug: "piercing-earrings"
  },
  {
    name: "Pink Glow Banana",
    slug: "pink-glow-banana",
    description: "Банан з рожевими акцентами для пірсингу брови або пупка.",
    price: 430,
    oldPrice: 520,
    stock: 18,
    material: "Хірургічна сталь",
    size: "10 мм",
    gauge: "16G",
    color: "Рожевий",
    isNew: false,
    isPopular: true,
    image: "/name.png",
    categorySlug: "barbells"
  },
  {
    name: "LUNÉ Aftercare Mist",
    slug: "lune-aftercare-mist",
    description: "Спрей для щоденного догляду за пірсингом після процедури.",
    price: 260,
    oldPrice: null,
    stock: 40,
    material: "Сольовий розчин",
    size: "100 мл",
    gauge: "Догляд",
    color: "Прозорий",
    isNew: false,
    isPopular: false,
    image: "/logo.png",
    categorySlug: "aftercare"
  }
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: product.categorySlug } });
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        material: product.material,
        size: product.size,
        gauge: product.gauge,
        color: product.color,
        isNew: product.isNew,
        isPopular: product.isPopular,
        image: product.image,
        categoryId: category.id
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        material: product.material,
        size: product.size,
        gauge: product.gauge,
        color: product.color,
        isNew: product.isNew,
        isPopular: product.isPopular,
        image: product.image,
        categoryId: category.id
      }
    });
  }

  const customer = await prisma.customer.upsert({
    where: { email: "demo@lune.local" },
    update: {},
    create: {
      name: "Demo Customer",
      email: "demo@lune.local",
      phone: "+380000000000",
      city: "Миколаїв",
      address: "Demo address"
    }
  });

  const firstProduct = await prisma.product.findFirstOrThrow();

  await prisma.review.upsert({
    where: { id: 1 },
    update: {},
    create: {
      productId: firstProduct.id,
      customerId: customer.id,
      rating: 5,
      text: "Прикраса виглядає ніжно та акуратно, дуже сподобався стиль."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
