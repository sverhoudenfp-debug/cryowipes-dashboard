import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getShopifyData() {
  const tokenRes = await fetch(`https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
  const headers = { 'X-Shopify-Access-Token': token };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, productsRes, customersRes, lastWeekRes, prevWeekRes] = await Promise.all([
    fetch(`${base}/orders.json?status=any&limit=250`, { headers }),
    fetch(`${base}/products.json?limit=50`, { headers }),
    fetch(`${base}/customers.json?limit=50`, { headers }),
    fetch(`${base}/orders.json?status=any&created_at_min=${sevenDaysAgo}&limit=250`, { headers }),
    fetch(`${base}/orders.json?status=any&created_at_min=${fourteenDaysAgo}&created_at_max=${sevenDaysAgo}&limit=250`, { headers }),
  ]);

  const [ordersData, productsData, customersData, lastWeekData, prevWeekData] = await Promise.all([
    ordersRes.json(), productsRes.json(), customersRes.json(), lastWeekRes.json(), prevWeekRes.json(),
  ]);

  const orders = ordersData.orders || [];
  const products = productsData.products || [];
  const customers = customersData.customers || [];
  const lastWeekOrders = lastWeekData.orders || [];
  const prevWeekOrders = prevWeekData.orders || [];

  const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

  const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const prevWeekRevenue = prevWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const revenueGrowth = prevWeekRevenue > 0 ? (((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100).toFixed(1) : 'N/A';

  const productSales: Record<string, { title: string; count: number; revenue: number }> = {};
  lastWeekOrders.forEach((o: any) => {
    o.line_items?.forEach((item: any) => {
      if (!productSales[item.product_id]) productSales[item.product_id] = { title: item.title, count: 0, revenue: 0 };
      productSales[item.product_id].count += item.quantity;
      productSales[item.product_id].revenue += parseFloat(item.price) * item.quantity;
    });
  });

  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return { orders, products, customers, todayOrders, todayRevenue, totalRevenue, aov, lastWeekOrders, lastWeekRevenue, prevWeekRevenue, revenueGrowth, topProducts };
}

async function getMetaData() {
  const metaToken = process.env.META_ACCESS_TOKEN;
  const adAccount = 'act_1315459333262567';

  const [insightsRes, campaignsRes, prevInsightsRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v20.0/${adAccount}/insights?fields=spend,impressions,clicks,ctr,cpc,cpp,reach,actions&date_preset=last_7d&access_token=${metaToken}`),
    fetch(`https://graph.facebook.com/v20.0/${adAccount}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,insights{spend,impressions,clicks,ctr,cpc}&date_preset=last_7d&access_token=${metaToken}`),
    fetch(`https://graph.facebook.com/v20.0/${adAccount}/insights?fields=spend,impressions,clicks,ctr&date_preset=last_14d&access_token=${metaToken}`),
  ]);

  const [insightsData, campaignsData, prevInsightsData] = await Promise.all([
    insightsRes.json(), campaignsRes.json(), prevInsightsRes.json(),
  ]);

  const meta = insightsData.data?.[0] || {};
  const prevMeta = prevInsightsData.data?.[0] || {};
  const campaigns = campaignsData.data || [];

  const purchases = meta.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
  const roas = meta.spend && parseFloat(meta.spend) > 0 ? (parseFloat(purchases) / parseFloat(meta.spend)).toFixed(2) : '0';
  const ctrChange = prevMeta.ctr && meta.ctr ? (((parseFloat(meta.ctr) - parseFloat(prevMeta.ctr)) / parseFloat(prevMeta.ctr)) * 100).toFixed(1) : 'N/A';

  return { meta, campaigns, purchases, roas, ctrChange };
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const [shopify, metaResult] = await Promise.all([getShopifyData(), getMetaData()]);
    const { orders, products, customers, todayOrders, todayRevenue, totalRevenue, aov, lastWeekOrders, lastWeekRevenue, prevWeekRevenue, revenueGrowth, topProducts } = shopify;
    const { meta, campaigns, purchases, roas, ctrChange } = metaResult;

    const signals: string[] = [];
    if (parseFloat(meta.ctr || '0') < 1) signals.push('⚠️ CTR onder 1% — advertentietekst of targeting waarschijnlijk niet optimaal');
    if (parseFloat(meta.cpc || '0') > 2) signals.push('⚠️ CPC boven $2 — overweeg targeting te verfijnen of budget te herverdelen');
    if (parseFloat(roas) < 2 && parseFloat(meta.spend || '0') > 0) signals.push('⚠️ ROAS onder 2x — campagnes draaien momenteel verlies');
    if (parseFloat(roas) > 3) signals.push('✅ ROAS boven 3x — goede performance, overweeg budget te verhogen');
    if (todayOrders.length === 0) signals.push('⚠️ Nog geen orders vandaag');
    if (parseFloat(revenueGrowth) > 10) signals.push(`✅ Omzet groeit +${revenueGrowth}% week over week`);
    if (parseFloat(revenueGrowth) < -10) signals.push(`⚠️ Omzet daalt ${revenueGrowth}% week over week`);

    const systemPrompt = `Je bent de AI performance manager voor CryoWipes (cryowipes.store) — een cooling skincare webshop die koelende doekjes verkoopt. Je eigenaar is Silivjn.

JOUW ROL:
Je bent niet alleen een chatbot — je bent een proactieve e-commerce manager die continu data analyseert, patronen herkent, en concrete acties voorstelt om de sales te maximaliseren. Denk als een ervaren performance marketeer die gefocust is op USA en Canada als primaire markten.

TARGETING CONTEXT:
- Primaire markten: USA 🇺🇸 en Canada 🇨🇦
- Doelgroep: mensen die actief zijn in sporten, outdoor, of warme klimaten
- Product: koelende skincare doekjes — ideaal bij sporten, warm weer, festivals
- Prijs positionering: premium maar toegankelijk
- Seizoenspatroon: hogere vraag in zomer en warmere maanden

═══ LIVE SHOPIFY DATA ═══
Totale omzet (all time): $${totalRevenue.toFixed(2)}
Totaal orders: ${orders.length}
Gem. orderwaarde (AOV): $${aov.toFixed(2)}
Klanten: ${customers.length}

Vandaag:
- Orders: ${todayOrders.length}
- Omzet: $${todayRevenue.toFixed(2)}

Afgelopen 7 dagen:
- Orders: ${lastWeekOrders.length}
- Omzet: $${lastWeekRevenue.toFixed(2)}
- Vorige week: $${prevWeekRevenue.toFixed(2)}
- Groei: ${revenueGrowth}%

Top producten deze week:
${topProducts.map((p, i) => `${i + 1}. ${p.title} — ${p.count}x verkocht — $${p.revenue.toFixed(2)}`).join('\n')}

Producten in catalogus:
${products.map((p: any) => `- ${p.title} (ID: ${p.id}, variant ID: ${p.variants?.[0]?.id}, prijs: $${p.variants?.[0]?.price}, voorraad: ${p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)} stuks)`).join('\n')}

═══ LIVE META ADS DATA (laatste 7 dagen) ═══
Spend: $${meta.spend || '0'}
Impressies: ${Number(meta.impressions || 0).toLocaleString()}
Clicks: ${meta.clicks || '0'}
CTR: ${meta.ctr ? parseFloat(meta.ctr).toFixed(2) : '0'}% ${ctrChange !== 'N/A' ? `(${parseFloat(ctrChange) > 0 ? '+' : ''}${ctrChange}% vs vorige periode)` : ''}
CPC: $${meta.cpc ? parseFloat(meta.cpc).toFixed(2) : '0'}
Bereik: ${Number(meta.reach || 0).toLocaleString()}
Aankopen via Meta: ${purchases}
ROAS: ${roas}x

Campagnes:
${campaigns.map((c: any) => {
  const ci = c.insights?.data?.[0] || {};
  return `- ${c.name} | ${c.status} | Budget: $${c.daily_budget ? (parseInt(c.daily_budget) / 100).toFixed(2) : 'lifetime'}/dag | Spend: $${ci.spend || '0'} | CTR: ${ci.ctr ? parseFloat(ci.ctr).toFixed(2) : '0'}% | CPC: $${ci.cpc ? parseFloat(ci.cpc).toFixed(2) : '0'} (ID: ${c.id})`;
}).join('\n')}

═══ AUTOMATISCHE SIGNALEN ═══
${signals.length > 0 ? signals.join('\n') : '✅ Geen kritieke signalen op dit moment'}

═══ BESCHIKBARE ACTIES ═══

Shopify:
- update_product_title: {"product_id": 123, "new_title": "Nieuwe Titel"}
- update_product_price: {"variant_id": 123, "new_price": "29.99"}
- update_inventory: {"inventory_item_id": 123, "new_quantity": 50}

Meta Ads:
- pause_campaign: {"campaign_id": "123"}
- resume_campaign: {"campaign_id": "123"}
- update_campaign_budget: {"campaign_id": "123", "new_budget": 20}
- create_full_campaign: {
    "campaign_name": "CryoWipes - Naam",
    "objective": "OUTCOME_SALES",
    "daily_budget": 10,
    "targeting_countries": ["US", "CA"],
    "age_min": 18,
    "age_max": 45,
    "ad_headline": "Stay Cool Anywhere",
    "ad_body": "CryoWipes cooling wipes for instant skin relief. Try now!",
    "ad_url": "https://cryowipes.store",
    "image_url": "https://..."
  }

GEDRAGSREGELS:
1. Analyseer ALTIJD de data proactief — wijs op kansen en problemen ook als er niet specifiek naar gevraagd wordt
2. Geef altijd concrete, cijfermatige aanbevelingen (bijv. "verhoog budget van $10 naar $15/dag")
3. Focus op USA en Canada — stel targeting hier altijd op in bij nieuwe campagnes
4. Denk in termen van ROAS, CAC en LTV
5. Als een campagne slecht presteert (CTR < 1% of ROAS < 2), stel direct een actie voor
6. Vergelijk altijd met vorige periode om trends te identificeren
7. Antwoord in het Nederlands, maar advertentieteksten in het Engels (voor USA/Canada)
8. Gebruik GEEN markdown tabellen in je antwoorden — gebruik gewone tekst met regels

Als je een actie wil voorstellen, sluit je antwoord af met:
ACTION_JSON:{"type":"ACTIE_TYPE","description":"Duidelijke uitleg","payload":{...}}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    let action = null;
    const actionMatch = text.match(/ACTION_JSON:(\{[\s\S]*\})/);
    if (actionMatch) {
      try { action = JSON.parse(actionMatch[1]); } catch {}
    }

    const cleanText = text.replace(/ACTION_JSON:\{[\s\S]*\}/, '').trim();

    return NextResponse.json({ content: cleanText, action });
  } catch (error: any) {
    return NextResponse.json({ content: 'Er ging iets mis: ' + error.message }, { status: 500 });
  }
}
