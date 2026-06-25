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

async function getMetaData() {
  const accountId = 'act_1315459333262567';
  const token = process.env.META_ACCESS_TOKEN;
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${accountId}/campaigns?fields=name,status,daily_budget,lifetime_budget&access_token=${token}`
  );
  const campaigns = await res.json();

  const insightsRes = await fetch(
    `https://graph.facebook.com/v20.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,actions&date_preset=last_7d&access_token=${token}`
  );
  const insights = await insightsRes.json();
  return { campaigns: campaigns.data || [], insights: insights.data || [] };
}

const systemPrompt = `Je bent de AI manager voor CryoWipes (cryowipes.store), een cooling skincare webshop van Silivjn.
Je kan helpen met ads, Shopify statistieken, SEO en social media.
Antwoord altijd in het Nederlands. Wees direct en concreet.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    let shopifyContext = '';
    let metaContext = '';

    try {
      const token = await getShopifyToken();
      const orders = await getShopifyData(token);
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
      const aov = orders.length > 0 ? totalRevenue / orders.length : 0;
      shopifyContext = `\n\nLIVE SHOPIFY DATA:\n- Orders: ${orders.length}\n- Omzet: €${totalRevenue.toFixed(2)}\n- AOV: €${aov.toFixed(2)}`;
    } catch (e) {
      shopifyContext = '\n\n(Shopify data tijdelijk niet beschikbaar)';
    }

    try {
      const meta = await getMetaData();
      const spend = meta.insights[0]?.spend || '0';
      const impressions = meta.insights[0]?.impressions || '0';
      const clicks = meta.insights[0]?.clicks || '0';
      const ctr = meta.insights[0]?.ctr || '0';
      metaContext = `\n\nLIVE META ADS DATA (laatste 7 dagen):\n- Campagnes: ${meta.campaigns.length}\n- Spend: €${spend}\n- Impressies: ${impressions}\n- Clicks: ${clicks}\n- CTR: ${parseFloat(ctr).toFixed(2)}%`;
    } catch (e) {
      metaContext = '\n\n(Meta Ads data tijdelijk niet beschikbaar)';
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt + shopifyContext + metaContext,
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
