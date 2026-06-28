import { NextRequest, NextResponse } from 'next/server';

const PAGE_ID = '61590315366201';
const INSTAGRAM_ACTOR_ID = '24292588933773149';
const AD_ACCOUNT_ID = 'act_1315459333262567';
const PIXEL_ID = process.env.META_PIXEL_ID || '';

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
    const { action, payload } = await request.json();
    const metaToken = process.env.META_ACCESS_TOKEN;

    // ── SHOPIFY BASIS ACTIES ───────────────────────────────────
    if (['update_product_title', 'update_product_price', 'update_inventory', 'update_product_description'].includes(action)) {
      const token = await getShopifyToken();
      const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
      const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

      if (action === 'update_product_title') {
        const res = await fetch(`${base}/products/${payload.product_id}.json`, {
          method: 'PUT', headers,
          body: JSON.stringify({ product: { id: payload.product_id, title: payload.new_title } }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, result: data.product?.title });
      }

      if (action === 'update_product_price') {
        const res = await fetch(`${base}/variants/${payload.variant_id}.json`, {
          method: 'PUT', headers,
          body: JSON.stringify({ variant: { id: payload.variant_id, price: payload.new_price } }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, result: data.variant?.price });
      }

      if (action === 'update_product_description') {
        const res = await fetch(`${base}/products/${payload.product_id}.json`, {
          method: 'PUT', headers,
          body: JSON.stringify({ product: { id: payload.product_id, body_html: payload.value } }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, result: !!data.product });
      }

      if (action === 'update_inventory') {
        const locRes = await fetch(`${base}/locations.json`, { headers });
        const locData = await locRes.json();
        const locationId = locData.locations?.[0]?.id;
        const res = await fetch(`${base}/inventory_levels/set.json`, {
          method: 'POST', headers,
          body: JSON.stringify({ location_id: locationId, inventory_item_id: payload.inventory_item_id, available: payload.new_quantity }),
        });
        return NextResponse.json({ success: true, result: await res.json() });
      }
    }

    // ── SEO ACTIES ─────────────────────────────────────────────
    if (['update_seo_title', 'update_seo_description', 'update_image_alt', 'update_collection_description'].includes(action)) {
      const token = await getShopifyToken();
      const base = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01`;
      const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

      if (action === 'update_seo_title') {
        const mfRes = await fetch(`${base}/products/${payload.product_id}/metafields.json`, { headers });
        const mfData = await mfRes.json();
        const existing = (mfData.metafields || []).find((m: any) => m.namespace === 'global' && m.key === 'title_tag');
        if (existing) {
          const res = await fetch(`${base}/metafields/${existing.id}.json`, { method: 'PUT', headers, body: JSON.stringify({ metafield: { id: existing.id, value: payload.value, type: 'single_line_text_field' } }) });
          return NextResponse.json({ success: true, result: await res.json() });
        } else {
          const res = await fetch(`${base}/products/${payload.product_id}/metafields.json`, { method: 'POST', headers, body: JSON.stringify({ metafield: { namespace: 'global', key: 'title_tag', value: payload.value, type: 'single_line_text_field' } }) });
          return NextResponse.json({ success: true, result: await res.json() });
        }
      }

      if (action === 'update_seo_description') {
        const mfRes = await fetch(`${base}/products/${payload.product_id}/metafields.json`, { headers });
        const mfData = await mfRes.json();
        const existing = (mfData.metafields || []).find((m: any) => m.namespace === 'global' && m.key === 'description_tag');
        if (existing) {
          const res = await fetch(`${base}/metafields/${existing.id}.json`, { method: 'PUT', headers, body: JSON.stringify({ metafield: { id: existing.id, value: payload.value, type: 'single_line_text_field' } }) });
          return NextResponse.json({ success: true, result: await res.json() });
        } else {
          const res = await fetch(`${base}/products/${payload.product_id}/metafields.json`, { method: 'POST', headers, body: JSON.stringify({ metafield: { namespace: 'global', key: 'description_tag', value: payload.value, type: 'single_line_text_field' } }) });
          return NextResponse.json({ success: true, result: await res.json() });
        }
      }

      if (action === 'update_image_alt') {
        const res = await fetch(`${base}/products/${payload.product_id}/images/${payload.image_id}.json`, { method: 'PUT', headers, body: JSON.stringify({ image: { id: payload.image_id, alt: payload.value } }) });
        return NextResponse.json({ success: true, result: await res.json() });
      }

      if (action === 'update_collection_description') {
        const res = await fetch(`${base}/custom_collections/${payload.collection_id}.json`, { method: 'PUT', headers, body: JSON.stringify({ custom_collection: { id: payload.collection_id, body_html: payload.value } }) });
        return NextResponse.json({ success: true, result: await res.json() });
      }
    }

    // ── META ADS ACTIES ────────────────────────────────────────
    if (action === 'pause_campaign') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED', access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    if (action === 'resume_campaign') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    if (action === 'update_campaign_budget') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: payload.new_budget * 100, access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    // ── META VOLLEDIGE CAMPAGNE AANMAKEN ───────────────────────
    if (action === 'create_full_campaign') {
      const {
        campaign_name,
        objective = 'OUTCOME_SALES',
        daily_budget = 20,
        targeting_countries = ['US', 'CA'],
        age_min = 18,
        age_max = 45,
        ad_headline,
        ad_body,
        ad_url = 'https://cryowipes.store/products/cryo-wipe-box',
        image_url,
      } = payload;

      // Stap 1: Campagne aanmaken
      const campaignRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaign_name,
          objective,
          status: 'PAUSED',
          special_ad_categories: [],
          is_adset_budget_sharing_enabled: false,
          access_token: metaToken,
        }),
      });
      const campaignData = await campaignRes.json();
      if (campaignData.error) {
        console.error('Campaign error:', campaignData.error);
        return NextResponse.json({ success: false, error: `Campagne: ${campaignData.error.message}` });
      }
      const campaign_id = campaignData.id;

      // Stap 2: Ad set aanmaken
      const adSetBody: any = {
        name: `${campaign_name} - Ad Set`,
        campaign_id,
        daily_budget: daily_budget * 100,
        billing_event: 'IMPRESSIONS',
        optimization_goal: PIXEL_ID ? 'OFFSITE_CONVERSIONS' : 'LINK_CLICKS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: {
          geo_locations: { countries: targeting_countries },
          age_min,
          age_max,
          targeting_automation: { advantage_audience: 0 },
        },
        status: 'PAUSED',
        access_token: metaToken,
      };

      if (PIXEL_ID) {
        adSetBody.promoted_object = {
          pixel_id: PIXEL_ID,
          custom_event_type: 'PURCHASE',
        };
      }

      const adSetRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adSetBody),
      });
      const adSetData = await adSetRes.json();
      if (adSetData.error) {
        console.error('Ad set error:', adSetData.error);
        return NextResponse.json({ success: false, error: `Ad set: ${adSetData.error.message}` });
      }
      const adset_id = adSetData.id;

      // Stap 3: Creative aanmaken — alleen afbeeldingen ondersteund via API
      // Video's moeten handmatig worden toegevoegd in Meta Ads Manager
const creativeBody: any = {
  name: `${campaign_name} - Creative`,
  object_story_spec: {
    page_id: PAGE_ID,
    link_data: {
      message: ad_body || 'Stay cool anywhere with CryoWipes — instant cooling wipes for skin relief.',
      link: ad_url,
      name: ad_headline || 'Stay Cool Anywhere',
      description: 'Shop now at cryowipes.store',
      call_to_action: { type: 'SHOP_NOW', value: { link: ad_url } },
      attachment_style: 'link',
    },
  },
  access_token: metaToken,
};

if (INSTAGRAM_ACTOR_ID) {
  creativeBody.object_story_spec.instagram_user_id = INSTAGRAM_ACTOR_ID;
}

      // Alleen afbeeldingen toevoegen (geen video via URL)
      if (image_url && !image_url.includes('.mp4') && !image_url.includes('video')) {
        creativeBody.object_story_spec.link_data.picture = image_url;
      }

      const creativeRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeBody),
      });
      const creativeData = await creativeRes.json();
      if (creativeData.error) {
        console.error('Creative error:', creativeData.error);
        return NextResponse.json({ success: false, error: `Creative: ${creativeData.error.message}` });
      }

      // Stap 4: Ad aanmaken
      const adRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign_name} - Ad`,
          adset_id,
          creative: { creative_id: creativeData.id },
          status: 'PAUSED',
          access_token: metaToken,
        }),
      });
      const adData = await adRes.json();
      if (adData.error) {
        console.error('Ad error:', adData.error);
        return NextResponse.json({ success: false, error: `Ad: ${adData.error.message}` });
      }

      return NextResponse.json({
        success: true,
        result: {
          campaign_id,
          adset_id,
          creative_id: creativeData.id,
          ad_id: adData.id,
          message: `Campagne "${campaign_name}" aangemaakt! Staat op PAUSED — activeer hem in Meta Ads Manager. Let op: video's moeten handmatig worden toegevoegd in Meta Ads Manager.`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Onbekende actie' });
  } catch (e: any) {
    console.error('Actions error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
