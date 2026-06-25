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
    const headers = { 'X-Shopify-Access-Token': token };
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;

    const [productsRes, collectionsRes, pagesRes] = await Promise.all([
      fetch(`${base}/products.json?limit=50&fields=id,title,handle,body_html,images,metafields`, { headers }),
      fetch(`${base}/custom_collections.json?limit=50&fields=id,title,handle,body_html`, { headers }),
      fetch(`${base}/pages.json?limit=50&fields=id,title,handle,body_html`, { headers }),
    ]);

    const [productsData, collectionsData, pagesData] = await Promise.all([
      productsRes.json(),
      collectionsRes.json(),
      pagesRes.json(),
    ]);

    const products = productsData.products || [];
    const collections = collectionsData.custom_collections || [];
    const pages = pagesData.pages || [];

    const issues: any[] = [];
    let totalScore = 100;

    // Check producten
    products.forEach((p: any) => {
      const pageIssues = [];

      if (!p.title || p.title.length < 10) {
        pageIssues.push({ type: 'meta_title', severity: 'hoog', message: 'Titel te kort of ontbreekt', current: p.title || '', suggestion: '' });
        totalScore -= 3;
      }
      if (p.title && p.title.length > 70) {
        pageIssues.push({ type: 'meta_title', severity: 'medium', message: 'Titel te lang (>70 tekens)', current: p.title, suggestion: p.title.substring(0, 67) + '...' });
        totalScore -= 2;
      }
      if (!p.body_html || p.body_html.replace(/<[^>]*>/g, '').length < 100) {
        pageIssues.push({ type: 'description', severity: 'hoog', message: 'Productbeschrijving te kort of ontbreekt', current: '', suggestion: '' });
        totalScore -= 3;
      }

      // Check afbeeldingen ALT teksten
      if (p.images) {
        p.images.forEach((img: any) => {
          if (!img.alt || img.alt.trim() === '') {
            pageIssues.push({ type: 'alt_text', severity: 'medium', message: `Afbeelding mist ALT-tekst`, current: '', suggestion: `${p.title} - CryoWipes`, imageId: img.id });
            totalScore -= 1;
          }
        });
      }

      if (pageIssues.length > 0) {
        issues.push({
          page_type: 'product',
          page_id: p.id,
          page_title: p.title,
          handle: p.handle,
          url: `https://cryowipes.store/products/${p.handle}`,
          issues: pageIssues,
        });
      }
    });

    // Check collecties
    collections.forEach((c: any) => {
      const pageIssues = [];
      if (!c.body_html || c.body_html.replace(/<[^>]*>/g, '').length < 50) {
        pageIssues.push({ type: 'description', severity: 'medium', message: 'Collectiebeschrijving ontbreekt', current: '', suggestion: '' });
        totalScore -= 2;
      }
      if (pageIssues.length > 0) {
        issues.push({
          page_type: 'collection',
          page_id: c.id,
          page_title: c.title,
          handle: c.handle,
          url: `https://cryowipes.store/collections/${c.handle}`,
          issues: pageIssues,
        });
      }
    });

    const score = Math.max(0, Math.min(100, totalScore));
    const highCount = issues.reduce((sum, p) => sum + p.issues.filter((i: any) => i.severity === 'hoog').length, 0);
    const mediumCount = issues.reduce((sum, p) => sum + p.issues.filter((i: any) => i.severity === 'medium').length, 0);

    return NextResponse.json({
      score,
      totalPages: products.length + collections.length + pages.length,
      issuePages: issues.length,
      highCount,
      mediumCount,
      issues,
      lastScanned: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
