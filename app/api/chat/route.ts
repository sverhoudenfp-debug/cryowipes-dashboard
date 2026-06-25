import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    const { messages } = await request.json();

    const token = await getShopifyToken();
    const headers = { 'X-Shopify-Access-Token': token };
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersRes, productsRes, customersRes] = await Promise.all([
      fetch(`${base}/orders.json?status=any&limit=250`, { headers }),
      fetch(`${base}/products.json?limit=50`, { headers }),
      fetch(`${base}/customers.json?limit=50`, { headers }),
    ]);

    const [ordersData, productsData, customersData] = await Promise.all([
      ordersRes.json(),
      productsRes.json(),
      customersRes.json(),
    ]);

    const orders = ordersData.orders || [];
    const products = productsData.products || [];
    const customers = customersData.customers || [];

    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/act_1315459333262567/insights?fields=spend,impressions,clicks,ctr&date_preset=last_7d&access_token=${process.env.META_ACCESS_TOKEN}`
    );
    const metaData = await metaRes.json();
    const meta = metaData.data?.[0] || {};

    const systemPrompt = `Je bent de AI manager voor CryoWipes (cryowipes.store), een cooling skincare webshop van Silivjn.

Je hebt twee modi:
1. ANALYSEREN - data bekijken en uitleggen
2. ACTIES VOORSTELLEN - concrete wijzigingen voorstellen die de gebruiker kan goedkeuren

LIVE SHOPIFY DATA:
- Totale omzet: $${totalRevenue.toFixed(2)}
- Totaal orders: ${orders.length}
- AOV: $${aov.toFixed(2)}
- Orders vandaag: ${todayOrders.length}
- Omzet vandaag: $${todayRevenue.toFixed(2)}
- Producten: ${products.map((p: any) => `${p.title} (ID: ${p.id}, variant ID: ${p.variants?.[0]?.id}, prijs: $${p.variants?.[0]?.price}, voorraad: ${p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)})`).join(' | ')}
- Klanten: ${customers.length}

LIVE META ADS:
- Spend: $${meta.spend || '0'}
- Impressies: ${meta.impressions || '0'}
- Clicks: ${meta.clicks || '0'}
- CTR: ${meta.ctr ? parseFloat(meta.ctr).toFixed(2) : '0'}%

Als je een actie wil voorstellen, sluit je antwoord dan af met een JSON blok in dit exacte formaat:
ACTION_JSON:{"type":"update_product_title","description":"Verander de titel van [product] naar [nieuwe titel]","payload":{"product_id":123,"new_title":"Nieuwe Titel"}}

Of voor prijs:
ACTION_JSON:{"type":"update_product_price","description":"Verander de prijs van [product] naar $XX","payload":{"variant_id":123,"new_price":"XX.00"}}

Antwoord altijd in het Nederlands. Wees direct en concreet.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    // Parse action uit het antwoord
    let action = null;
    const actionMatch = text.match(/ACTION_JSON:({.*})/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch {}
    }

    const cleanText = text.replace(/ACTION_JSON:{.*}/, '').trim();

    return NextResponse.json({ content: cleanText, action });
  } catch (error: any) {
    return NextResponse.json({ content: 'Er ging iets mis: ' + error.message }, { status: 500 });
  }
}
