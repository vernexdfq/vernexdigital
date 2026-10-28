import { createBrowserClient } from "@/lib/supabase/client";

export type ShopCondition = "Brand New" | "Refurbished" | "Used";

export type ShopAdminProduct = {
  id: string;
  title: string;
  category: string;
  images: string[]; // public storage URLs
  condition: ShopCondition;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string; // ISO timestamp
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

export const SHOP_PRODUCTS_BUCKET = "shop-products";

type ShopProductRow = {
  id: string;
  title: string;
  category: string;
  condition: ShopCondition;
  description: string | null;
  price: string | number;
  stock: number;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
};

const SELECT_COLUMNS =
  "id, title, category, condition, description, price, stock, images, is_active, created_at";

/** Turn raw Supabase errors into messages customers/admins can act on. */
function friendlyError(message: string): string {
  if (message.toLowerCase().includes("row-level security")) {
    return "This account is not flagged as admin in Supabase. Sign in with your admin account (or run the admin setup SQL), then try again.";
  }
  return message;
}

function rowToProduct(row: ShopProductRow): ShopAdminProduct {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : [],
    condition: row.condition,
    description: row.description ?? "",
    price: Number(row.price) || 0,
    stock: row.stock ?? 0,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
  };
}

/** Load products from Supabase. Admins see everything; customers only see active rows (RLS). */
export async function fetchShopProducts(opts?: { includeInactive?: boolean }): Promise<ShopAdminProduct[]> {
  const supabase = createBrowserClient();
  let query = supabase.from("shop_products").select(SELECT_COLUMNS);
  if (!opts?.includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToProduct(row as ShopProductRow));
}

/** Upload photos to the shop-products bucket, then insert the product row. */
export async function createShopProduct(input: {
  title: string;
  category: string;
  condition: ShopCondition;
  description: string;
  price: number;
  stock: number;
  files: File[];
}): Promise<ShopAdminProduct> {
  if (input.files.length < 3) {
    throw new Error("Add at least 3 photos");
  }
  const supabase = createBrowserClient();
  const productId = crypto.randomUUID();
  const imageUrls: string[] = [];
  const uploadedPaths: string[] = [];
  try {
    for (const file of input.files) {
      if (!file.type.startsWith("image/")) {
        throw new Error(file.name + " is not an image");
      }
      const extension =
        (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = productId + "/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await supabase.storage
        .from(SHOP_PRODUCTS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(friendlyError(uploadError.message));
      uploadedPaths.push(path);
      const { data } = supabase.storage.from(SHOP_PRODUCTS_BUCKET).getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    const { data, error } = await supabase
      .from("shop_products")
      .insert({
        id: productId,
        title: input.title,
        category: input.category,
        condition: input.condition,
        description: input.description,
        price: input.price,
        stock: input.stock,
        images: imageUrls,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw new Error(friendlyError(error.message));
    return rowToProduct(data as ShopProductRow);
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from(SHOP_PRODUCTS_BUCKET)
        .remove(uploadedPaths)
        .catch(() => {
          /* best-effort cleanup */
        });
    }
    throw error;
  }
}

export async function updateShopProductStock(id: string, stock: number): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("shop_products").update({ stock }).eq("id", id);
  if (error) throw new Error(error.message);
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/" + SHOP_PRODUCTS_BUCKET + "/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length);
  return path.split("?")[0] || null;
}

/** Delete the product row, then best-effort remove its bucket images. */
export async function deleteShopProduct(product: Pick<ShopAdminProduct, "id" | "images">): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("shop_products").delete().eq("id", product.id);
  if (error) throw new Error(error.message);
  const paths = product.images.map(storagePathFromPublicUrl).filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage
      .from(SHOP_PRODUCTS_BUCKET)
      .remove(paths)
      .catch(() => {
        /* best-effort cleanup */
      });
  }
}

/**
 * Purchase through the place_shop_order RPC — wallet debit, stock reservation
 * and order creation happen atomically server-side. Reuse the same requestId
 * when retrying a failed attempt; use a new one for a new purchase.
 */
export async function placeShopOrder(productId: string, quantity: number, requestId: string): Promise<string> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc("place_shop_order", {
    p_product_id: productId,
    p_quantity: quantity,
    p_request_id: requestId,
  });
  if (error) throw new Error(error.message);
  return String(data ?? "");
}
