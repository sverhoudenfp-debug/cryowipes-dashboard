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

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    case 'yesterday': {
      const d = new Date(now); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d;
    }
    case 'last_7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
    }
    case 'last_30d': {
      const d = new Date(now); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d;
    }
    default: {
      const d = new Date(now); d.setDate(d.getDate() - 7); d.setHours(0, 0, 0, 0); return d;
    }
  }
}

function getPeriodEnd(period: string): Date | null {
  if (period === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null; // null = up to now
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'last_7d';

    const token = await getShopifyToken();
    const headers = { 'X-Shopify-Access-Token': token };
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;

    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    // Always fetch today for todayOrders/todayRevenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [ordersRes, productsRes, customersRes] = await Promise.all([
      fetch(`${base}/orders.json?status=any&limit=250&created_at_min=${periodStart.toISOString()}`, { headers }),
      fetch(`${base}/products.json?limit=50`, { headers }),
      fetch(`${base}/customers.json?limit=50`, { headers }),
    ]);

    const [ordersData, productsData, customersData] = await Promise.all([
      ordersRes.json(),
      productsRes.json(),
      customersRes.json(),
    ]);

    let orders = ordersData.orders || [];
    const products = productsData.products || [];
    const customers = customersData.customers || [];

    // Filter by period end if yesterday
    if (periodEnd) {
      orders = orders.filter((o: any) => new Date(o.created_at) <= periodEnd!);
    }

    // Today stats (always based on actual today)
    const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= todayStart);
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    const productStats = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      variants: p.variants?.length || 0,
      inventory: p.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
      price: p.variants?.[0]?.price || '0',
    }));

    const ordersByDay: Record<string, number> = {};
    orders.forEach((o: any) => {
      const day = o.created_at.split('T')[0];
      ordersByDay[day] = (ordersByDay[day] || 0) + parseFloat(o.total_price || '0');
    });

    return NextResponse.json({
      orders: orders.length,
      revenue: totalRevenue.toFixed(2),
      aov: aov.toFixed(2),
      todayOrders: todayOrders.length,
      todayRevenue: todayRevenue.toFixed(2),
      products: productStats,
      totalProducts: products.length,
      totalCustomers: customers.length,
      ordersByDay,
      recentOrders: orders.slice(0, 10).map((o: any) => ({
        id: o.name,
        date: o.created_at.split('T')[0],
        total: o.total_price,
        status: o.fulfillment_status || 'unfulfilled',
        customer: o.email,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
