export type ShopCondition = "Brand New" | "Refurbished" | "Used";

export type ShopAdminProduct = {
  id: string;
  title: string;
  category: string;
  images: string[]; // data URLs (or remote URLs when wired to storage later)
  condition: ShopCondition;
  description: string;
  price: number;
  stock: number;
  createdAt: number;
};

export const SHOP_CATEGORIES = [
  "Laptops & Computers",
  "Mobile Phones",
  "Electronics",
  "Airpods & Audio",
  "Power Banks & Chargers",
  "Smart Watches",
  "Tablets",
  "Gaming",
  "Phone Accessories",
] as const;

export const SHOP_CONDITIONS: ShopCondition[] = ["Brand New", "Refurbished", "Used"];

export const SHOP_PRODUCTS_KEY = "vernexdigital_shop_products_v1";

export function loadShopProducts(): ShopAdminProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHOP_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is ShopAdminProduct =>
        !!item &&
        typeof item === "object" &&
        typeof (item as ShopAdminProduct).title === "string" &&
        typeof (item as ShopAdminProduct).price === "number",
    );
  } catch {
    return [];
  }
}

export function saveShopProducts(products: ShopAdminProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHOP_PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("vernex-shop-products-updated"));
  } catch {
    /* storage full — ignore for now, move to Supabase later */
  }
}
