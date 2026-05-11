export type ProductCardData = {
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
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export type CartItem = {
  productId: number;
  quantity: number;
};

export type SessionUser = {
  id: string;
  role: "user" | "admin";
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  photo: string;
  phone: string;
  city: string;
  address: string;
  createdAt: string;
};

export type CustomerOrderData = {
  id: number;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: number;
      name: string;
      slug: string;
      image: string;
    };
  }>;
};