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

async function getShopifyData(token: string) {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?status=any&limit=50`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  const data = await res.json();
  return data.orders || [];
}

const systemPrompt = `Je bent de AI manager voor CryoWipes (cryowipes.store), een cooling skincare webshop van Silivjn.
Je kan helpen met ads, Shopify statistieken, SEO en social media.
Antwoord altijd in het Nederlands. Wees direct en concreet.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    let shopifyContext = '';
    try {
      const token = await getShopifyToken();
      const orders = await getShopifyData(token);
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
      shopifyContext = `\n\nLIVE SHOPIFY DATA:\n- Aantal orders: ${orders.length}\n- Totale omzet: €${totalRevenue.toFixed(2)}`;
    } catch (e) {
      shopifyContext = '\n\n(Shopify data tijdelijk niet beschikbaar)';
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt + shopifyContext,
      messages,
    });

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ content: text });
  } catch (error: any) {
    return NextResponse.json({ content: 'Er ging iets mis: ' + error.message }, { status: 500 });
  }
}
