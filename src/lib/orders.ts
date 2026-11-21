export const ORDER_STATUSES = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItem = { slug: string; name: string; qty: number; price: number };
export const parseItems = (s: string): OrderItem[] => { try { return JSON.parse(s); } catch { return []; } };
