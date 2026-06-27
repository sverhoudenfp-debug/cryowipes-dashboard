import { NextResponse } from 'next/server';

const NOTIFY_EMAIL = 'silvijnverhouden552@gmail.com';

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
      from: 'CryoWipes Dashboard <onboarding@resend.dev>',
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

    const [ordersRes, productsRes, metaAccountRes, metaInsightsRes] = await Promise.all([
      fetch(`${base}/orders.json?status=any&limit=250&fields=id,created_at,total_price`, { headers }),
      fetch(`${base}/products.json?limit=250&fields=id,title,variants`, { headers }),
      fetch(`https://graph.facebook.com/v20.0/act_1315459333262567?fields=balance,currency&access_token=${metaToken}`),
      fetch(`https://graph.facebook.com/v20.0/act_1315459333262567/insights?fields=spend,impressions,clicks,ctr,cpc,actions&date_preset=last_7d&access_token=${metaToken}`),
    ]);

    const [ordersData, productsData, metaAccount, metaInsights] = await Promise.all([
      ordersRes.json(), productsRes.json(), metaAccountRes.json(), metaInsightsRes.json(),
    ]);

    const orders = ordersData.orders || [];
    const products = productsData.products || [];
    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today);
    const balance = parseInt(metaAccount.balance || '0') / 100;
    const currency = metaAccount.currency || 'USD';
    const meta = metaInsights.data?.[0] || {};
    const purchases = meta.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
    const roas = meta.spend && parseFloat(meta.spend) > 0 ? parseFloat(purchases) / parseFloat(meta.spend) : 0;

    const notifications: { type: string; severity: 'critical' | 'warning' | 'info'; title: string; message: string; sendEmail: boolean }[] = [];

    if (balance < 20 && balance >= 0) {
      notifications.push({
        type: 'meta_balance',
        severity: balance < 5 ? 'critical' : 'warning',
        title: balance < 5 ? '🚨 Meta saldo kritiek laag' : '⚠️ Meta saldo bijna op',
        message: `Je Meta Ads saldo is ${currency} $${balance.toFixed(2)}. ${balance < 5 ? 'Laad direct bij om onderbrekingen te voorkomen!' : 'Overweeg bij te laden.'}`,
        sendEmail: balance < 10,
      });
    }

    if (todayOrders.length === 0 && new Date().getHours() >= 14) {
      notifications.push({
        type: 'no_orders',
        severity: 'warning',
        title: '⚠️ Nog geen orders vandaag',
        message: 'Je hebt vandaag nog geen orders ontvangen. Controleer je campagnes en website.',
        sendEmail: false,
      });
    }

    const lowStockProducts = products.filter((p: any) => {
      const stock = p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0;
      return stock < 5 && stock >= 0;
    });
    if (lowStockProducts.length > 0) {
      notifications.push({
        type: 'low_stock',
        severity: lowStockProducts.some((p: any) => p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) === 0) ? 'critical' : 'warning',
        title: '📦 Lage voorraad',
        message: `De volgende producten hebben lage voorraad: ${lowStockProducts.map((p: any) => {
          const stock = p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0;
          return `${p.title} (${stock} stuks)`;
        }).join(', ')}`,
        sendEmail: lowStockProducts.some((p: any) => p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) === 0),
      });
    }

    if (roas > 0 && roas < 2 && parseFloat(meta.spend || '0') > 5) {
      notifications.push({
        type: 'low_roas',
        severity: 'warning',
        title: '📉 Lage ROAS',
        message: `Je ROAS is ${roas.toFixed(2)}x — onder de 2x breakeven. Overweeg campagnes te pauzeren of aan te passen.`,
        sendEmail: roas < 1,
      });
    }

    if (parseFloat(meta.cpc || '0') > 3) {
      notifications.push({
        type: 'high_cpc',
        severity: 'warning',
        title: '💸 Hoge CPC',
        message: `Je CPC is $${parseFloat(meta.cpc).toFixed(2)} — boven $3. Overweeg je targeting of advertentietekst aan te passen.`,
        sendEmail: false,
      });
    }

    if (roas > 3) {
      notifications.push({
        type: 'good_roas',
        severity: 'info',
        title: '✅ Goede ROAS',
        message: `Je ROAS is ${roas.toFixed(2)}x — overweeg je budget te verhogen voor meer sales!`,
        sendEmail: false,
      });
    }

    // ── Emails sturen voor kritieke meldingen ──
    const emailNotifications = notifications.filter(n => n.sendEmail);
    if (emailNotifications.length > 0) {
      const emailHtml = `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #060810; color: #e8eaf0; padding: 32px; border-radius: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 28px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">❄</div>
            <div>
              <div style="font-size: 18px; font-weight: 700;">CryoWipes Dashboard</div>
              <div style="font-size: 12px; color: #5a6280;">Automatische alert — ${new Date().toLocaleString('nl-NL')}</div>
            </div>
          </div>
          ${emailNotifications.map(n => `
            <div style="background: #111525; border: 1px solid ${n.severity === 'critical' ? '#ff5c5c40' : '#ffb54740'}; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
              <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px; color: ${n.severity === 'critical' ? '#ff5c5c' : '#ffb547'};">${n.title}</div>
              <div style="font-size: 13px; color: #8892b0; line-height: 1.6;">${n.message}</div>
            </div>
          `).join('')}
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #1e2540; text-align: center;">
            <a href="https://cryowipes-ads-dashboard.vercel.app" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Open Dashboard →
            </a>
          </div>
        </div>
      `;
      await sendEmail(
        `🚨 CryoWipes Alert — ${emailNotifications.map(n => n.title).join(', ')}`,
        emailHtml
      );
    }

    // ── TEST EMAIL — verwijder dit als het werkt ──
    await sendEmail(
      '🧪 Test melding CryoWipes Dashboard',
      `<div style="font-family: Inter, sans-serif; background: #060810; color: #e8eaf0; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">❄</div>
          <div>
            <div style="font-size: 18px; font-weight: 700;">CryoWipes Dashboard</div>
            <div style="font-size: 12px; color: #5a6280;">Test melding</div>
          </div>
        </div>
        <div style="background: #111525; border: 1px solid #00e5a040; border-radius: 12px; padding: 20px;">
          <div style="font-size: 15px; font-weight: 600; color: #00e5a0; margin-bottom: 8px;">✅ Email notificaties werken!</div>
          <div style="font-size: 13px; color: #8892b0; line-height: 1.6;">Je CryoWipes dashboard kan je nu automatisch mailen bij alerts zoals lage voorraad, laag Meta saldo of slechte ROAS.</div>
        </div>
        <div style="margin-top: 24px; text-align: center;">
          <a href="https://cryowipes-ads-dashboard.vercel.app" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f8ef7, #00d4ff); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Open Dashboard →
          </a>
        </div>
      </div>`
    );

    return NextResponse.json({
      notifications,
      emailsSent: emailNotifications.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
