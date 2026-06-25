import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const token = await getShopifyToken();
    const res = await fetch(`https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?status=any&limit=50`, {
      headers: { 'X-Shopify-Access-Token': token },
    });
    const data = await res.json();
    const orders = data.orders || [];
    const revenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const aov = orders.length > 0 ? revenue / orders.length : 0;
    return NextResponse.json({
      orders: orders.length,
      revenue: revenue.toFixed(2),
      aov: aov.toFixed(2),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
