ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS product_price_positive;
ALTER TABLE "Product" ADD CONSTRAINT product_price_positive CHECK (price > 0);

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS product_stock_non_negative;
ALTER TABLE "Product" ADD CONSTRAINT product_stock_non_negative CHECK (stock >= 0);

ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS review_rating_range;
ALTER TABLE "Review" ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS product_price_idx ON "Product" (price);
CREATE INDEX IF NOT EXISTS product_category_price_idx ON "Product" ("categoryId", price);
CREATE INDEX IF NOT EXISTS order_status_created_idx ON "Order" (status, "createdAt");

CREATE OR REPLACE FUNCTION get_product_final_price(product_id_input INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  result NUMERIC;
BEGIN
  SELECT COALESCE("oldPrice", price, 0) INTO result
  FROM "Product"
  WHERE id = product_id_input;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_order_item_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock INTO current_stock FROM "Product" WHERE id = NEW."productId";

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product was not found';
  END IF;

  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  IF NEW.quantity > current_stock THEN
    RAISE EXCEPTION 'Not enough products in stock';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_item_stock_trigger ON "OrderItem";
CREATE TRIGGER order_item_stock_trigger
BEFORE INSERT ON "OrderItem"
FOR EACH ROW EXECUTE FUNCTION check_order_item_stock();

CREATE OR REPLACE PROCEDURE create_order_from_json(
  IN customer_name_input TEXT,
  IN customer_email_input TEXT,
  IN customer_phone_input TEXT,
  IN customer_city_input TEXT,
  IN customer_address_input TEXT,
  IN items_input JSONB,
  INOUT created_order_id INTEGER DEFAULT NULL,
  INOUT result_status TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
  existing_customer_id INTEGER;
  generated_number TEXT;
  product_row RECORD;
  cursor_row RECORD;
  order_total NUMERIC := 0;
  items_cursor REFCURSOR;
BEGIN
  result_status := 'STARTED';

  INSERT INTO "Customer" (name, email, phone, city, address, "createdAt")
  VALUES (customer_name_input, customer_email_input, customer_phone_input, customer_city_input, customer_address_input, NOW())
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    address = EXCLUDED.address
  RETURNING id INTO existing_customer_id;

  generated_number := 'LUNE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || FLOOR(RANDOM() * 900 + 100)::TEXT;

  INSERT INTO "Order" (number, "customerId", status, total, comment, "createdAt", "updatedAt")
  VALUES (generated_number, existing_customer_id, 'NEW', 0, 'Created by stored procedure', NOW(), NOW())
  RETURNING id INTO created_order_id;

  OPEN items_cursor FOR
    SELECT * FROM jsonb_to_recordset(items_input) AS x("productId" INTEGER, quantity INTEGER);

  LOOP
    FETCH items_cursor INTO cursor_row;
    EXIT WHEN NOT FOUND;

    SELECT id, price, stock INTO product_row
    FROM "Product"
    WHERE id = cursor_row."productId"
    FOR UPDATE;

    IF product_row.id IS NULL THEN
      RAISE EXCEPTION 'Product was not found';
    END IF;

    IF cursor_row.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    IF product_row.stock < cursor_row.quantity THEN
      RAISE EXCEPTION 'Not enough products in stock';
    END IF;

    INSERT INTO "OrderItem" ("orderId", "productId", quantity, "unitPrice", "lineTotal")
    VALUES (created_order_id, product_row.id, cursor_row.quantity, product_row.price, product_row.price * cursor_row.quantity);

    UPDATE "Product"
    SET stock = stock - cursor_row.quantity
    WHERE id = product_row.id;

    order_total := order_total + product_row.price * cursor_row.quantity;
  END LOOP;

  CLOSE items_cursor;

  UPDATE "Order"
  SET total = order_total, "updatedAt" = NOW()
  WHERE id = created_order_id;

  result_status := 'OK';
END;
$$;
