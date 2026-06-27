import { NextResponse } from 'next/server';

const NOTIFY_EMAIL = 'silvijnverhouden552@gmail.com';

// Bijhoudt welke alerts vandaag al een email hebben gestuurd
// Reset automatisch de volgende dag
const emailSentToday: Record<string, string> = {};

// Bijhoudt welke orders al gemeld zijn
const notifiedOrderIds = new Set<string>();

function alreadySentToday(type: string): boolean {
  const today = new Date().toDateString();
  return emailSentToday[type] === today;
}

function markSentToday(type: string) {
  emailSentToday[type] = new Date().toDateString();
}

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

async function sendEmail(subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CryoWipes Dashboard <dashboard@cryowipes.store>',
      to: NOTIFY_EMAIL,
      subject,
      html,
    }),
  });
  return res.json();
}

export async function GET() {
  try {
    const token = await getShopifyToken();
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
    const headers = { 'X-Shopify-Access-Token': token };
    const metaToken = process.env.META_ACCESS_TOKEN;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [ordersRes, productsRes, metaAccountRes, metaInsightsRes, newOrdersRes] = await Promise.all([
      fetch(`${base}/orders.json?status=any&limit=250&fields=id,created_at,total_price`, { headers }),
      fetch(`${base}/products.json?limit=250&fields=id,title,variants`, { headers }),
      fetch(`https://graph.facebook.com/v20.0/act_1315459333262567?fields=balance,currency&access_token=${metaToken}`),
      fetch(`https://graph.facebook.com/v20.0/act_1315459333262567/insights?fields=spend,impressions,clicks,ctr,cpc,actions&date_preset=last_7d&access_token=${metaToken}`),
      fetch(`${base}/orders.json?status=any&created_at_min=${fiveMinutesAgo}&limit=10&fields=id,name,created_at,total_price,email,line_items,shipping_address`, { headers }),
    ]);

    const [ordersData, productsData, metaAccount, metaInsights, newOrdersData] = await Promise.all([
      ordersRes.json(), productsRes.json(), metaAccountRes.json(), metaInsightsRes.json(), newOrdersRes.json(),
    ]);

    const orders = ordersData.orders || [];
    const products = productsData.products || [];
    const newOrders = (newOrdersData.orders || []).filter((o: any) => !notifiedOrderIds.has(String(o.id)));
    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
    const balance = parseInt(metaAccount.balance || '0') / 100;
    const currency = metaAccount.currency || 'USD';
    const meta = metaInsights.data?.[0] || {};
    const purchases = meta.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
    const roas = meta.spend && parseFloat(meta.spend) > 0 ? parseFloat(purchases) / parseFloat(meta.spend) : 0;

    const notifications: { type: string; severity: 'critical' | 'warning' | 'info'; title: string; message: string; sendEmail: boolean }[] = [];
    let emailsSent = 0;

    // ── Nieuwe order melding — altijd email per nieuwe order ──
    for (const order of newOrders) {
      const customerName = order.shipping_address
        ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
        : order.email || 'Onbekende klant';
      const orderProducts = order.line_items?.map((i: any) => `${i.title} (${i.quantity}x)`).join(', ') || '';

      notifications.push({
        type: 'new_order',
        severity: 'info',
        title: `🛍 Nieuwe order — $${parseFloat(order.total_price).toFixed(2)}`,
        message: `Order ${order.name} van ${customerName} — ${orderProducts}`,
        sendEmail: true,
      });

      await sendEmail(
        `🛍 Nieuwe order ${order.name} — $${parseFloat(order.total_price).toFixed(2)}`,
        `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #060810; color: #e8eaf0; padding: 32px; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 28px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">❄</div>
            <div>
              <div style="font-size: 18px; font-weight: 700;">CryoWipes Dashboard</div>
              <div style="font-size: 12px; color: #5a6280;">Nieuwe order — ${new Date().toLocaleString('nl-NL')}</div>
            </div>
          </div>
          <div style="background: #111525; border: 1px solid #00e5a040; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 22px; font-weight: 800; color: #00e5a0; margin-bottom: 4px;">$${parseFloat(order.total_price).toFixed(2)}</div>
            <div style="font-size: 14px; color: #8892b0;">Order ${order.name}</div>
          </div>
          <div style="background: #111525; border: 1px solid #1e2540; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: #5a6280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">Details</div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e2540;">
              <span style="font-size: 13px; color: #8892b0;">Klant</span>
              <span style="font-size: 13px; color: #e8eaf0; font-weight: 500;">${customerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e2540;">
              <span style="font-size: 13px; color: #8892b0;">Producten</span>
              <span style="font-size: 13px; color: #e8eaf0; font-weight: 500;">${orderProducts}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-size: 13px; color: #8892b0;">Tijdstip</span>
              <span style="font-size: 13px; color: #e8eaf0; font-weight: 500;">${new Date(order.created_at).toLocaleString('nl-NL')}</span>
            </div>
          </div>
          <div style="text-align: center;">
            <a href="https://cryowipes-ads-dashboard.vercel.app" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 8px;">
              Open Dashboard →
            </a>
            <a href="https://admin.shopify.com/store/cryowipes/orders/${order.id}" style="display: inline-block; padding: 12px 24px; background: #111525; border: 1px solid #1e2540; color: #e8eaf0; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Bekijk order →
            </a>
          </div>
        </div>`
      );

      notifiedOrderIds.add(String(order.id));
      emailsSent++;
    }

    // ── Meta saldo laag — max 1x per dag email ──
    if (balance < 20 && balance >= 0) {
      const shouldEmail = balance < 10 && !alreadySentToday('meta_balance');
      notifications.push({
        type: 'meta_balance',
        severity: balance < 5 ? 'critical' : 'warning',
        title: balance < 5 ? '🚨 Meta saldo kritiek laag' : '⚠️ Meta saldo bijna op',
        message: `Je Meta Ads saldo is ${currency} $${balance.toFixed(2)}. ${balance < 5 ? 'Laad direct bij om onderbrekingen te voorkomen!' : 'Overweeg bij te laden.'}`,
        sendEmail: shouldEmail,
      });
      if (shouldEmail) {
        await sendEmail(
          `🚨 Meta saldo laag — $${balance.toFixed(2)}`,
          `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #060810; color: #e8eaf0; padding: 32px; border-radius: 16px;">
            <div style="background: #111525; border: 1px solid #ff5c5c40; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
              <div style="font-size: 15px; font-weight: 600; color: #ff5c5c; margin-bottom: 6px;">${balance < 5 ? '🚨 Meta saldo kritiek laag' : '⚠️ Meta saldo bijna op'}</div>
              <div style="font-size: 13px; color: #8892b0;">Je Meta Ads saldo is ${currency} $${balance.toFixed(2)}. Laad bij om je campagnes actief te houden.</div>
            </div>
            <div style="text-align: center;">
              <a href="https://cryowipes-ads-dashboard.vercel.app" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Open Dashboard →</a>
            </div>
          </div>`
        );
        markSentToday('meta_balance');
        emailsSent++;
      }
    }

    // ── Geen orders vandaag — alleen in dashboard, geen email ──
    if (todayOrders.length === 0 && new Date().getHours() >= 14) {
      notifications.push({
        type: 'no_orders',
        severity: 'warning',
        title: '⚠️ Nog geen orders vandaag',
        message: 'Je hebt vandaag nog geen orders ontvangen. Controleer je campagnes en website.',
        sendEmail: false,
      });
    }

    // ── Lage voorraad — max 1x per dag email ──
    const lowStockProducts = products.filter((p: any) => {
      const stock = p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0;
      return stock < 5 && stock >= 0;
    });
    if (lowStockProducts.length > 0) {
      const hasOutOfStock = lowStockProducts.some((p: any) => p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) === 0);
      const shouldEmail = hasOutOfStock && !alreadySentToday('low_stock');
      notifications.push({
        type: 'low_stock',
        severity: hasOutOfStock ? 'critical' : 'warning',
        title: '📦 Lage voorraad',
        message: `De volgende producten hebben lage voorraad: ${lowStockProducts.map((p: any) => {
          const stock = p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0;
          return `${p.title} (${stock} stuks)`;
        }).join(', ')}`,
        sendEmail: shouldEmail,
      });
      if (shouldEmail) {
        await sendEmail(
          `📦 Lage voorraad — actie vereist`,
          `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #060810; color: #e8eaf0; padding: 32px; border-radius: 16px;">
            <div style="background: #111525; border: 1px solid #ff5c5c40; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
              <div style="font-size: 15px; font-weight: 600; color: #ff5c5c; margin-bottom: 6px;">📦 Lage voorraad</div>
              <div style="font-size: 13px; color: #8892b0;">${lowStockProducts.map((p: any) => {
                const stock = p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0;
                return `${p.title}: ${stock} stuks`;
              }).join('<br/>')}</div>
            </div>
            <div style="text-align: center;">
              <a href="https://admin.shopify.com/store/cryowipes/products" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Bekijk producten →</a>
            </div>
          </div>`
        );
        markSentToday('low_stock');
        emailsSent++;
      }
    }

    // ── Slechte ROAS — max 1x per dag email ──
    if (roas > 0 && roas < 2 && parseFloat(meta.spend || '0') > 5) {
      const shouldEmail = roas < 1 && !alreadySentToday('low_roas');
      notifications.push({
        type: 'low_roas',
        severity: 'warning',
        title: '📉 Lage ROAS',
        message: `Je ROAS is ${roas.toFixed(2)}x — onder de 2x breakeven. Overweeg campagnes te pauzeren of aan te passen.`,
        sendEmail: shouldEmail,
      });
      if (shouldEmail) {
        markSentToday('low_roas');
        emailsSent++;
      }
    }

    // ── Hoge CPC — alleen dashboard ──
    if (parseFloat(meta.cpc || '0') > 3) {
      notifications.push({
        type: 'high_cpc',
        severity: 'warning',
        title: '💸 Hoge CPC',
        message: `Je CPC is $${parseFloat(meta.cpc).toFixed(2)} — boven $3. Overweeg je targeting of advertentietekst aan te passen.`,
        sendEmail: false,
      });
    }

    // ── Goede ROAS — alleen dashboard ──
    if (roas > 3) {
      notifications.push({
        type: 'good_roas',
        severity: 'info',
        title: '✅ Goede ROAS',
        message: `Je ROAS is ${roas.toFixed(2)}x — overweeg je budget te verhogen voor meer sales!`,
        sendEmail: false,
      });
    }

    return NextResponse.json({
      notifications,
      emailsSent,
      checkedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
