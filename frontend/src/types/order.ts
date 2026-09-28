export type OrderStatus = "PAID" | "CANCELLED";

export type OrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  option?: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  reviewed: boolean;
};

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  /** ISO 8601 (+09:00) */
  orderedAt: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
};
