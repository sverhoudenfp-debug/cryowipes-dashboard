import { NextRequest, NextResponse } from 'next/server';

async function getShopifyToken() {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();
    const token = await getShopifyToken();
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    if (action === 'update_product_title') {
      const res = await fetch(`${base}/products/${payload.product_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ product: { id: payload.product_id, title: payload.new_title } }),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, result: data.product?.title });
    }

    if (action === 'update_product_price') {
      const res = await fetch(`${base}/variants/${payload.variant_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ variant: { id: payload.variant_id, price: payload.new_price } }),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, result: data.variant?.price });
    }

    if (action === 'update_inventory') {
      const locRes = await fetch(`${base}/locations.json`, { headers });
      const locData = await locRes.json();
      const locationId = locData.locations?.[0]?.id;
      const res = await fetch(`${base}/inventory_levels/set.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: locationId,
          inventory_item_id: payload.inventory_item_id,
          available: payload.new_quantity,
        }),
      });
      const data = await res.json();
      return NextResponse.json({ success: true, result: data });
    }

    return NextResponse.json({ success: false, error: 'Onbekende actie' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
