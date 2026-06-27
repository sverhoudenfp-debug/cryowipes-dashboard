import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

async function generateSEOSuggestion(type: string, context: string): Promise<string> {
  const prompts: Record<string, string> = {
    meta_title: `Schrijf een SEO-geoptimaliseerde meta title voor dit Shopify product van CryoWipes (koelende doekjes, gericht op USA/Canada). Max 60 tekens. Geef ALLEEN de title terug, geen uitleg.\n\nContext: ${context}`,
    meta_description: `Schrijf een SEO-geoptimaliseerde meta description voor dit Shopify product van CryoWipes. Max 155 tekens, prikkelend en met een call-to-action. Geef ALLEEN de description terug.\n\nContext: ${context}`,
    alt_text: `Schrijf een beschrijvende ALT-tekst voor een productafbeelding van CryoWipes. Max 125 tekens. Geef ALLEEN de alt-tekst terug.\n\nContext: ${context}`,
    body_html: `Schrijf een SEO-geoptimaliseerde productbeschrijving in het Engels voor CryoWipes. Minimaal 150 woorden, gebruik keywords zoals "cooling wipes", "skin care", "instant cooling". Geef de beschrijving terug als plain text (geen HTML tags).\n\nContext: ${context}`,
    collection_description: `Schrijf een SEO-geoptimaliseerde collectiebeschrijving in het Engels voor CryoWipes. Minimaal 80 woorden. Geef de beschrijving terug als plain text.\n\nContext: ${context}`,
  };

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompts[type] || context }],
    });
    return response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    const token = await getShopifyToken();
    const headers = { 'X-Shopify-Access-Token': token };
    const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;

    const [productsRes, collectionsRes, pagesRes] = await Promise.all([
      fetch(`${base}/products.json?limit=50&fields=id,title,handle,body_html,images,tags,product_type,variants`, { headers }),
      fetch(`${base}/custom_collections.json?limit=50&fields=id,title,handle,body_html`, { headers }),
      fetch(`${base}/pages.json?limit=50&fields=id,title,handle,body_html`, { headers }),
    ]);

    const [productsData, collectionsData, pagesData] = await Promise.all([
      productsRes.json(), collectionsRes.json(), pagesRes.json(),
    ]);

    // Metafields ophalen per product
    const products = productsData.products || [];
    const collections = collectionsData.custom_collections || [];
    const pages = pagesData.pages || [];

    const productMetafields = await Promise.all(
      products.map((p: any) =>
        fetch(`${base}/products/${p.id}/metafields.json`, { headers })
          .then(r => r.json())
          .then(d => ({ id: p.id, metafields: d.metafields || [] }))
          .catch(() => ({ id: p.id, metafields: [] }))
      )
    );

    const metafieldMap: Record<string, any[]> = {};
    productMetafields.forEach(({ id, metafields }) => { metafieldMap[id] = metafields; });

    const issues: any[] = [];
    let totalScore = 100;

    // ── Producten checken ──
    for (const p of products) {
      const pageIssues: any[] = [];
      const mf = metafieldMap[p.id] || [];
      const seoTitle = mf.find((m: any) => m.namespace === 'global' && m.key === 'title_tag')?.value || '';
      const seoDesc = mf.find((m: any) => m.namespace === 'global' && m.key === 'description_tag')?.value || '';
      const bodyText = (p.body_html || '').replace(/<[^>]*>/g, '').trim();
      const price = p.variants?.[0]?.price || '';

      // Meta title check
      if (!seoTitle) {
        const suggestion = await generateSEOSuggestion('meta_title', `Product: ${p.title}, Type: ${p.product_type}, Tags: ${p.tags}, Prijs: $${price}`);
        pageIssues.push({
          type: 'meta_title', severity: 'hoog',
          message: 'SEO meta title ontbreekt',
          current: '', suggestion,
          fix_action: 'update_seo_title',
          fix_payload: { product_id: p.id, value: suggestion },
        });
        totalScore -= 5;
      } else if (seoTitle.length > 60) {
        pageIssues.push({
          type: 'meta_title', severity: 'medium',
          message: `Meta title te lang (${seoTitle.length}/60 tekens)`,
          current: seoTitle, suggestion: seoTitle.substring(0, 57) + '...',
          fix_action: 'update_seo_title',
          fix_payload: { product_id: p.id, value: seoTitle.substring(0, 57) + '...' },
        });
        totalScore -= 2;
      } else if (seoTitle.length < 30) {
        pageIssues.push({
          type: 'meta_title', severity: 'medium',
          message: `Meta title te kort (${seoTitle.length}/30 min tekens)`,
          current: seoTitle, suggestion: '',
        });
        totalScore -= 2;
      }

      // Meta description check
      if (!seoDesc) {
        const suggestion = await generateSEOSuggestion('meta_description', `Product: ${p.title}, Beschrijving: ${bodyText.substring(0, 200)}, Prijs: $${price}`);
        pageIssues.push({
          type: 'meta_description', severity: 'hoog',
          message: 'SEO meta description ontbreekt',
          current: '', suggestion,
          fix_action: 'update_seo_description',
          fix_payload: { product_id: p.id, value: suggestion },
        });
        totalScore -= 5;
      } else if (seoDesc.length > 155) {
        pageIssues.push({
          type: 'meta_description', severity: 'medium',
          message: `Meta description te lang (${seoDesc.length}/155 tekens)`,
          current: seoDesc, suggestion: seoDesc.substring(0, 152) + '...',
          fix_action: 'update_seo_description',
          fix_payload: { product_id: p.id, value: seoDesc.substring(0, 152) + '...' },
        });
        totalScore -= 2;
      }

      // Productbeschrijving check
      if (!bodyText || bodyText.length < 100) {
        const suggestion = await generateSEOSuggestion('body_html', `Product: ${p.title}, Tags: ${p.tags}, Prijs: $${price}`);
        pageIssues.push({
          type: 'description', severity: 'hoog',
          message: 'Productbeschrijving te kort of ontbreekt',
          current: bodyText.substring(0, 100), suggestion,
          fix_action: 'update_product_description',
          fix_payload: { product_id: p.id, value: `<p>${suggestion}</p>` },
        });
        totalScore -= 4;
      }

      // ALT teksten check
      for (const img of (p.images || [])) {
        if (!img.alt || img.alt.trim() === '') {
          const suggestion = await generateSEOSuggestion('alt_text', `Product: ${p.title}, Afbeelding positie: ${img.position}`);
          pageIssues.push({
            type: 'alt_text', severity: 'medium',
            message: `Afbeelding #${img.position} mist ALT-tekst`,
            current: '', suggestion,
            fix_action: 'update_image_alt',
            fix_payload: { product_id: p.id, image_id: img.id, value: suggestion },
          });
          totalScore -= 1;
        }
      }

      // Handle check
      if (p.handle && p.handle.includes('copy')) {
        pageIssues.push({
          type: 'handle', severity: 'medium',
          message: 'URL handle bevat "copy" — waarschijnlijk een duplicate',
          current: p.handle, suggestion: p.handle.replace(/-copy.*$/, ''),
        });
        totalScore -= 2;
      }

      // Tags check
      if (!p.tags || p.tags.length === 0) {
        pageIssues.push({
          type: 'tags', severity: 'medium',
          message: 'Product heeft geen tags',
          current: '', suggestion: 'cooling wipes, skincare, sport, outdoor, summer',
        });
        totalScore -= 1;
      }

      if (pageIssues.length > 0) {
        issues.push({
          page_type: 'product',
          page_id: p.id,
          page_title: p.title,
          handle: p.handle,
          url: `https://cryowipes.store/products/${p.handle}`,
          seo_title: seoTitle,
          seo_description: seoDesc,
          issues: pageIssues,
        });
      }
    }

    // ── Collecties checken ──
    for (const c of collections) {
      const pageIssues: any[] = [];
      const bodyText = (c.body_html || '').replace(/<[^>]*>/g, '').trim();

      if (!bodyText || bodyText.length < 50) {
        const suggestion = await generateSEOSuggestion('collection_description', `Collectie: ${c.title}`);
        pageIssues.push({
          type: 'description', severity: 'medium',
          message: 'Collectiebeschrijving ontbreekt of te kort',
          current: bodyText, suggestion,
          fix_action: 'update_collection_description',
          fix_payload: { collection_id: c.id, value: `<p>${suggestion}</p>` },
        });
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
    }

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
