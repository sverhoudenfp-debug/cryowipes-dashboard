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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersRes, productsRes, customersRes, lastWeekRes, prevWeekRes, last30Res, collectionsRes, abandonedRes] = await Promise.all([
    fetch(`${base}/orders.json?status=any&limit=250&fields=id,name,email,created_at,total_price,subtotal_price,total_discounts,total_tax,financial_status,fulfillment_status,referring_site,source_name,payment_gateway,gateway,cancel_reason,cancelled_at,line_items,customer,shipping_address,discount_codes,note`, { headers }),
    fetch(`${base}/products.json?limit=250&fields=id,title,status,variants,images,tags,product_type,vendor,created_at`, { headers }),
    fetch(`${base}/customers.json?limit=250&fields=id,email,first_name,last_name,orders_count,total_spent,created_at,tags,default_address,accepts_marketing`, { headers }),
    fetch(`${base}/orders.json?status=any&created_at_min=${sevenDaysAgo}&limit=250&fields=id,name,email,created_at,total_price,financial_status,fulfillment_status,referring_site,source_name,payment_gateway,line_items,customer,discount_codes`, { headers }),
    fetch(`${base}/orders.json?status=any&created_at_min=${fourteenDaysAgo}&created_at_max=${sevenDaysAgo}&limit=250&fields=id,total_price,financial_status,line_items`, { headers }),
    fetch(`${base}/orders.json?status=any&created_at_min=${thirtyDaysAgo}&limit=250&fields=id,name,created_at,total_price,referring_site,source_name,payment_gateway,line_items,customer`, { headers }),
    fetch(`${base}/custom_collections.json?limit=50`, { headers }),
    fetch(`${base}/checkouts.json?limit=50&fields=id,email,created_at,total_price,referring_site,source_name`, { headers }),
  ]);

  const [ordersData, productsData, customersData, lastWeekData, prevWeekData, last30Data, collectionsData, abandonedData] = await Promise.all([
    ordersRes.json(), productsRes.json(), customersRes.json(),
    lastWeekRes.json(), prevWeekRes.json(), last30Res.json(),
    collectionsRes.json(), abandonedRes.json(),
  ]);

  const orders = ordersData.orders || [];
  const products = productsData.products || [];
  const customers = customersData.customers || [];
  const lastWeekOrders = lastWeekData.orders || [];
  const prevWeekOrders = prevWeekData.orders || [];
  const last30Orders = last30Data.orders || [];
  const collections = collectionsData.custom_collections || [];
  const abandonedCheckouts = abandonedData.checkouts || [];

  // ── Omzet berekeningen ──
  const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const aov = orders.length > 0 ? totalRevenue / orders.length : 0;
  const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const prevWeekRevenue = prevWeekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const last30Revenue = last30Orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
  const revenueGrowth = prevWeekRevenue > 0 ? (((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100).toFixed(1) : 'N/A';

  // ── Traffic bronnen ──
  const trafficSources: Record<string, number> = {};
  last30Orders.forEach((o: any) => {
    const source = o.referring_site
      ? (o.referring_site.includes('facebook') || o.referring_site.includes('instagram') ? 'Meta/Facebook'
        : o.referring_site.includes('google') ? 'Google'
        : o.referring_site.includes('tiktok') ? 'TikTok'
        : o.referring_site.includes('email') || o.referring_site.includes('klaviyo') ? 'Email'
        : o.referring_site)
      : (o.source_name || 'Direct/Onbekend');
    trafficSources[source] = (trafficSources[source] || 0) + 1;
  });

  // ── Betaalmethodes ──
  const paymentMethods: Record<string, number> = {};
  orders.forEach((o: any) => {
    const gateway = o.payment_gateway || o.gateway || 'Onbekend';
    paymentMethods[gateway] = (paymentMethods[gateway] || 0) + 1;
  });

  // ── Top producten ──
  const productSales: Record<string, { title: string; count: number; revenue: number }> = {};
  last30Orders.forEach((o: any) => {
    o.line_items?.forEach((item: any) => {
      if (!productSales[item.product_id]) productSales[item.product_id] = { title: item.title, count: 0, revenue: 0 };
      productSales[item.product_id].count += item.quantity;
      productSales[item.product_id].revenue += parseFloat(item.price) * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // ── Kortingscodes ──
  const discountUsage: Record<string, number> = {};
  orders.forEach((o: any) => {
    o.discount_codes?.forEach((d: any) => {
      discountUsage[d.code] = (discountUsage[d.code] || 0) + 1;
    });
  });

  // ── Klant analyse ──
  const returningCustomers = customers.filter((c: any) => c.orders_count > 1).length;
  const newCustomers = customers.filter((c: any) => c.orders_count === 1).length;
  const topCustomers = [...customers].sort((a: any, b: any) => parseFloat(b.total_spent) - parseFloat(a.total_spent)).slice(0, 5);

  // ── Landen ──
  const countries: Record<string, number> = {};
  orders.forEach((o: any) => {
    const country = o.shipping_address?.country || 'Onbekend';
    countries[country] = (countries[country] || 0) + 1;
  });

  // ── Fulfillment status ──
  const fulfillmentStats = {
    fulfilled: orders.filter((o: any) => o.fulfillment_status === 'fulfilled').length,
    unfulfilled: orders.filter((o: any) => !o.fulfillment_status).length,
    partial: orders.filter((o: any) => o.fulfillment_status === 'partial').length,
  };

  // ── Financial status ──
  const financialStats = {
    paid: orders.filter((o: any) => o.financial_status === 'paid').length,
    pending: orders.filter((o: any) => o.financial_status === 'pending').length,
    refunded: orders.filter((o: any) => o.financial_status === 'refunded').length,
  };

  // ── Recente orders detail ──
  const recentOrdersDetail = lastWeekOrders.slice(0, 20).map((o: any) => ({
    id: o.name,
    datum: o.created_at.split('T')[0],
    bedrag: o.total_price,
    klant: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : o.email || 'Gast',
    email: o.email,
    bron: o.referring_site || o.source_name || 'Direct',
    betaling: o.payment_gateway || 'Onbekend',
    status: o.fulfillment_status || 'onvervuld',
    producten: o.line_items?.map((i: any) => `${i.title} (${i.quantity}x)`).join(', '),
    kortingscode: o.discount_codes?.[0]?.code || 'Geen',
  }));

  return {
    orders, products, customers, collections,
    todayOrders, todayRevenue, totalRevenue, aov,
    lastWeekOrders, lastWeekRevenue, prevWeekRevenue, last30Revenue, revenueGrowth,
    topProducts, trafficSources, paymentMethods, discountUsage,
    returningCustomers, newCustomers, topCustomers,
    countries, fulfillmentStats, financialStats,
    recentOrdersDetail, abandonedCheckouts,
  };
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
    const {
      orders, products, customers, collections,
      todayOrders, todayRevenue, totalRevenue, aov,
      lastWeekOrders, lastWeekRevenue, prevWeekRevenue, last30Revenue, revenueGrowth,
      topProducts, trafficSources, paymentMethods, discountUsage,
      returningCustomers, newCustomers, topCustomers,
      countries, fulfillmentStats, financialStats,
      recentOrdersDetail, abandonedCheckouts,
    } = shopify;
    const { meta, campaigns, purchases, roas, ctrChange } = metaResult;

    // ── Automatische signalen ──
    const signals: string[] = [];
    if (parseFloat(meta.ctr || '0') < 1) signals.push('⚠️ CTR onder 1% — advertentietekst of targeting niet optimaal');
    if (parseFloat(meta.cpc || '0') > 2) signals.push('⚠️ CPC boven $2 — targeting verfijnen of budget herverdelen');
    if (parseFloat(roas) < 2 && parseFloat(meta.spend || '0') > 0) signals.push('⚠️ ROAS onder 2x — campagnes draaien momenteel verlies');
    if (parseFloat(roas) > 3) signals.push('✅ ROAS boven 3x — goede performance, overweeg budget te verhogen');
    if (todayOrders.length === 0) signals.push('⚠️ Nog geen orders vandaag');
    if (parseFloat(revenueGrowth) > 10) signals.push(`✅ Omzet groeit +${revenueGrowth}% week over week`);
    if (parseFloat(revenueGrowth) < -10) signals.push(`⚠️ Omzet daalt ${revenueGrowth}% week over week`);
    if (abandonedCheckouts.length > 0) signals.push(`⚠️ ${abandonedCheckouts.length} verlaten checkouts — overweeg een abandoned cart email`);
    const lowStockProducts = products.filter((p: any) => p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) < 5);
    if (lowStockProducts.length > 0) signals.push(`⚠️ Lage voorraad: ${lowStockProducts.map((p: any) => p.title).join(', ')}`);

    const systemPrompt = `Je bent de AI performance manager voor CryoWipes (cryowipes.store) — een cooling skincare webshop die koelende doekjes verkoopt. Je eigenaar is Silivjn.

JOUW ROL:
Je bent een proactieve e-commerce manager die alle beschikbare data analyseert en concrete acties voorstelt om sales te maximaliseren. Je hebt toegang tot ALLE Shopify data.

TARGETING CONTEXT:
- Primaire markten: USA 🇺🇸 en Canada 🇨🇦
- Doelgroep: sporters, outdoor mensen, warme klimaten, festivals
- Product: koelende skincare doekjes
- Seizoenspatroon: hogere vraag in zomer

═══ SHOPIFY — OMZET ═══
All-time omzet: $${totalRevenue.toFixed(2)} (${orders.length} orders)
Laatste 30 dagen: $${last30Revenue.toFixed(2)}
Laatste 7 dagen: $${lastWeekRevenue.toFixed(2)} (${lastWeekOrders.length} orders)
Vorige week: $${prevWeekRevenue.toFixed(2)}
Week-over-week groei: ${revenueGrowth}%
Vandaag: $${todayRevenue.toFixed(2)} (${todayOrders.length} orders)
Gem. orderwaarde (AOV): $${aov.toFixed(2)}

═══ SHOPIFY — KLANTEN ═══
Totaal klanten: ${customers.length}
Nieuwe klanten (1 order): ${newCustomers}
Terugkerende klanten: ${returningCustomers} (${customers.length > 0 ? ((returningCustomers / customers.length) * 100).toFixed(1) : 0}%)
Top klanten (op omzet):
${topCustomers.map((c: any, i: number) => `${i + 1}. ${c.first_name || ''} ${c.last_name || ''} — $${c.total_spent} — ${c.orders_count} orders`).join('\n')}

═══ SHOPIFY — TRAFFIC BRONNEN (laatste 30 dagen) ═══
${Object.entries(trafficSources).sort((a, b) => b[1] - a[1]).map(([source, count]) => `- ${source}: ${count} orders`).join('\n') || 'Geen data'}

═══ SHOPIFY — BETAALMETHODES ═══
${Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]).map(([method, count]) => `- ${method}: ${count}x`).join('\n') || 'Geen data'}

═══ SHOPIFY — LANDEN ═══
${Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, count]) => `- ${country}: ${count} orders`).join('\n') || 'Geen data'}

═══ SHOPIFY — ORDER STATUS ═══
Betaald: ${financialStats.paid} | In behandeling: ${financialStats.pending} | Terugbetaald: ${financialStats.refunded}
Verzonden: ${fulfillmentStats.fulfilled} | Onvervuld: ${fulfillmentStats.unfulfilled} | Deels: ${fulfillmentStats.partial}
Verlaten checkouts: ${abandonedCheckouts.length}

═══ SHOPIFY — TOP PRODUCTEN (laatste 30 dagen) ═══
${topProducts.map((p, i) => `${i + 1}. ${p.title} — ${p.count}x verkocht — $${p.revenue.toFixed(2)}`).join('\n') || 'Geen verkopen'}

═══ SHOPIFY — ALLE PRODUCTEN ═══
${products.map((p: any) => `- ${p.title} | Status: ${p.status} | Prijs: $${p.variants?.[0]?.price} | Voorraad: ${p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0)} stuks | ID: ${p.id} | Variant ID: ${p.variants?.[0]?.id}`).join('\n')}

═══ SHOPIFY — COLLECTIES ═══
${collections.map((c: any) => `- ${c.title} (ID: ${c.id})`).join('\n') || 'Geen collecties'}

═══ SHOPIFY — KORTINGSCODES GEBRUIKT ═══
${Object.entries(discountUsage).length > 0 ? Object.entries(discountUsage).sort((a, b) => b[1] - a[1]).map(([code, count]) => `- ${code}: ${count}x gebruikt`).join('\n') : 'Geen kortingscodes gebruikt'}

═══ SHOPIFY — RECENTE ORDERS (laatste 7 dagen) ═══
${recentOrdersDetail.map((o: any) => `Order ${o.id} | ${o.datum} | $${o.bedrag} | ${o.klant} | Bron: ${o.bron} | Betaling: ${o.betaling} | Producten: ${o.producten} | Korting: ${o.kortingscode}`).join('\n') || 'Geen recente orders'}

═══ META ADS (laatste 7 dagen) ═══
Spend: $${meta.spend || '0'} | Impressies: ${Number(meta.impressions || 0).toLocaleString()} | Clicks: ${meta.clicks || '0'}
CTR: ${meta.ctr ? parseFloat(meta.ctr).toFixed(2) : '0'}% ${ctrChange !== 'N/A' ? `(${parseFloat(ctrChange) > 0 ? '+' : ''}${ctrChange}% vs vorige periode)` : ''}
CPC: $${meta.cpc ? parseFloat(meta.cpc).toFixed(2) : '0'} | Bereik: ${Number(meta.reach || 0).toLocaleString()}
Aankopen via Meta: ${purchases} | ROAS: ${roas}x

Campagnes:
${campaigns.map((c: any) => {
  const ci = c.insights?.data?.[0] || {};
  return `- ${c.name} | ${c.status} | Budget: $${c.daily_budget ? (parseInt(c.daily_budget) / 100).toFixed(2) : 'lifetime'}/dag | Spend: $${ci.spend || '0'} | CTR: ${ci.ctr ? parseFloat(ci.ctr).toFixed(2) : '0'}% | CPC: $${ci.cpc ? parseFloat(ci.cpc).toFixed(2) : '0'} (ID: ${c.id})`;
}).join('\n') || 'Geen campagnes'}

═══ AUTOMATISCHE SIGNALEN ═══
${signals.length > 0 ? signals.join('\n') : '✅ Geen kritieke signalen'}

═══ BESCHIKBARE ACTIES ═══
Shopify:
- update_product_title: {"product_id": 123, "new_title": "Nieuwe Titel"}
- update_product_price: {"variant_id": 123, "new_price": "29.99"}
- update_inventory: {"inventory_item_id": 123, "new_quantity": 50}

Meta Ads:
- pause_campaign: {"campaign_id": "123"}
- resume_campaign: {"campaign_id": "123"}
- update_campaign_budget: {"campaign_id": "123", "new_budget": 20}
- create_full_campaign: {"campaign_name": "CryoWipes - Naam", "objective": "OUTCOME_SALES", "daily_budget": 10, "targeting_countries": ["US", "CA"], "age_min": 18, "age_max": 45, "ad_headline": "Stay Cool Anywhere", "ad_body": "CryoWipes cooling wipes for instant skin relief.", "ad_url": "https://cryowipes.store", "image_url": "https://..."}

GEDRAGSREGELS:
1. Analyseer data proactief — benoem kansen en problemen ook zonder dat ernaar gevraagd wordt
2. Geef concrete, cijfermatige aanbevelingen
3. Focus op USA en Canada voor nieuwe campagnes
4. Denk in ROAS, CAC en LTV
5. Vergelijk altijd met vorige periode
6. Antwoord in het Nederlands, advertentieteksten in het Engels
7. Gebruik GEEN markdown tabellen — gebruik gewone tekst
8. Als je traffic bronnen, betaalmethodes of order details bespreekt, gebruik dan de echte data hierboven

Als je een actie wil voorstellen:
ACTION_JSON:{"type":"ACTIE_TYPE","description":"Uitleg","payload":{...}}`;

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
