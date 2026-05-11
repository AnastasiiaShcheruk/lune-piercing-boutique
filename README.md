# LUNÉ Piercing Boutique

Вебзастосунок електронної комерції товарів для пірсингу.

## Швидкий запуск

```bash
npm install
cp .env.example .env
npx prisma generate
npm run db:push
npm run db:sql
npm run db:seed
npm run dev
```

Після запуску відкрий `http://localhost:3000`.

## Основні сторінки

- `/` — головна сторінка
- `/catalog` — каталог із фільтрацією
- `/cart` — кошик
- `/checkout` — оформлення замовлення
- `/admin` — адмін-панель
- `/admin/products` — CRUD товарів
- `/admin/categories` — CRUD категорій
- `/admin/reports` — NativeSQL, функція, процедура

## База даних

У проєкті є 6 сутностей:

- Category
- Product
- Customer
- Order
- OrderItem
- Review

Додатковий SQL знаходиться у `prisma/custom.sql`:

- check-обмеження
- індекси
- функція `get_product_final_price`
- тригер `order_item_stock_trigger`
- процедура `create_order_from_json`

## Деплой

1. Створити PostgreSQL базу даних.
2. Додати `DATABASE_URL` у `.env` локально та в Environment Variables на Vercel.
3. Завантажити проєкт на GitHub.
4. Імпортувати репозиторій у Vercel.
5. У Vercel Build Command залишити `npm run build`.
6. Перед деплоєм або після підключення бази виконати локально:

```bash
npm run db:push
npm run db:sql
npm run db:seed
```
