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
