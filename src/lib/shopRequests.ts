"use client";

import { createBrowserClient } from "@/lib/supabase/client";

export type ShopRequestStatus = "pending" | "quoted" | "confirmed" | "delivered" | "cancelled";

export type ShopOrderRequest = {
  id: string;
  productId: string | null;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  whatsapp: string;
  location: string;
  status: ShopRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ShopRequestMessage = {
  id: string;
  requestId: string;
  sender: "customer" | "admin";
  body: string;
  createdAt: string;
};

const REQ_COLS = "id, product_id, product_title, quantity, unit_price, whatsapp, location, status, created_at, updated_at";

function rowToRequest(r: any): ShopOrderRequest {
  return {
    id: r.id,
    productId: r.product_id ?? null,
    productTitle: r.product_title ?? "",
    quantity: Number(r.quantity) || 1,
    unitPrice: Number(r.unit_price) || 0,
    whatsapp: String(r.whatsapp ?? ""),
    location: String(r.location ?? ""),
    status: (r.status ?? "pending") as ShopRequestStatus,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  };
}

function rowToMessage(r: any): ShopRequestMessage {
  return {
    id: r.id,
    requestId: r.request_id,
    sender: r.sender === "admin" ? "admin" : "customer",
    body: String(r.body ?? ""),
    createdAt: r.created_at ?? "",
  };
}

export async function fetchMyRequests(): Promise<ShopOrderRequest[]> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to view your orders");
  const { data, error } = await supabase
    .from("shop_order_requests")
    .select(REQ_COLS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRequest);
}

export async function fetchAllRequests(): Promise<ShopOrderRequest[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("shop_order_requests")
    .select(REQ_COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRequest);
}

export async function createOrderRequest(input: {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  whatsapp: string;
  location: string;
}): Promise<ShopOrderRequest> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to place an order");

  const { data, error } = await supabase
    .from("shop_order_requests")
    .insert({
      user_id: user.id,
      product_id: input.productId,
      product_title: input.productTitle,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      whatsapp: input.whatsapp,
      location: input.location,
    })
    .select(REQ_COLS)
    .single();
  if (error) throw new Error(error.message);
  const request = rowToRequest(data);

  const total = Math.round(input.unitPrice * input.quantity);
  const body =
    "Order request: " + input.productTitle + " x " + input.quantity +
    " · " + "₦" + total.toLocaleString("en-NG") +
    ". Deliver to: " + input.location + ". WhatsApp: " + input.whatsapp;
  const { error: msgErr } = await supabase
    .from("shop_request_messages")
    .insert({ request_id: request.id, sender: "customer", body });
  if (msgErr) throw new Error(msgErr.message);

  return request;
}

export async function fetchRequestMessages(requestId: string): Promise<ShopRequestMessage[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("shop_request_messages")
    .select("id, request_id, sender, body, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToMessage);
}

export async function sendRequestMessage(
  requestId: string,
  sender: "customer" | "admin",
  body: string,
): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("shop_request_messages")
    .insert({ request_id: requestId, sender, body: body.slice(0, 2000) });
  if (error) throw new Error(error.message);
}

export async function updateRequestStatus(requestId: string, status: ShopRequestStatus): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("shop_order_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}

export function subscribeRequestMessages(requestId: string, onChange: () => void): () => void {
  const supabase = createBrowserClient();
  const channel = supabase
    .channel("shop-msgs-" + requestId)
    .on(
      "postgres_changes" as any,
      {
        event: "INSERT",
        schema: "public",
        table: "shop_request_messages",
        filter: "request_id=eq." + requestId,
      } as any,
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
