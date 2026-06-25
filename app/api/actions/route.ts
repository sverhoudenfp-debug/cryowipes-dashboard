import { NextRequest, NextResponse } from 'next/server';

const PAGE_ID = '61590315366201';
const INSTAGRAM_ACTOR_ID = '24292588933773149';
const AD_ACCOUNT_ID = 'act_1315459333262567';

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

    // ── SHOPIFY ACTIES ─────────────────────────────────────────
    if (['update_product_title', 'update_product_price', 'update_inventory'].includes(action)) {
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

      if (action === 'update_inventory') {
        const locRes = await fetch(`${base}/locations.json`, { headers });
        const locData = await locRes.json();
        const locationId = locData.locations?.[0]?.id;
        const res = await fetch(`${base}/inventory_levels/set.json`, {
          method: 'POST', headers,
          body: JSON.stringify({
            location_id: locationId,
            inventory_item_id: payload.inventory_item_id,
            available: payload.new_quantity,
          }),
        });
        return NextResponse.json({ success: true, result: await res.json() });
      }
    }

    // ── META ADS ACTIES ────────────────────────────────────────
    if (action === 'pause_campaign') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED', access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    if (action === 'resume_campaign') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    if (action === 'update_campaign_budget') {
      const res = await fetch(`https://graph.facebook.com/v20.0/${payload.campaign_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: payload.new_budget * 100, access_token: metaToken }),
      });
      return NextResponse.json({ success: true, result: await res.json() });
    }

    // ── META VOLLEDIGE CAMPAGNE AANMAKEN ───────────────────────
    if (action === 'create_full_campaign') {
      const {
        campaign_name,
        objective = 'OUTCOME_SALES',
        daily_budget = 1000,
        targeting_countries = ['NL'],
        age_min = 18,
        age_max = 45,
        ad_headline,
        ad_body,
        ad_url = 'https://cryowipes.store',
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
          access_token: metaToken,
        }),
      });
      const campaignData = await campaignRes.json();
      if (campaignData.error) return NextResponse.json({ success: false, error: campaignData.error.message });
      const campaign_id = campaignData.id;

      // Stap 2: Ad set aanmaken
      const adSetRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign_name} - Ad Set`,
          campaign_id,
          daily_budget: daily_budget * 100,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          targeting: {
            geo_locations: { countries: targeting_countries },
            age_min,
            age_max,
          },
          status: 'PAUSED',
          access_token: metaToken,
        }),
      });
      const adSetData = await adSetRes.json();
      if (adSetData.error) return NextResponse.json({ success: false, error: adSetData.error.message });
      const adset_id = adSetData.id;

      // Stap 3: Creative aanmaken
      const creativeBody: any = {
        name: `${campaign_name} - Creative`,
object_story_spec: {
  page_id: PAGE_ID,
  instagram_actor_id: INSTAGRAM_ACTOR_ID,
  link_data: {
            message: ad_body,
            link: ad_url,
            name: ad_headline,
            call_to_action: { type: 'SHOP_NOW', value: { link: ad_url } },
          },
        },
        access_token: metaToken,
      };

      if (image_url) {
        creativeBody.object_story_spec.link_data.picture = image_url;
      }

      const creativeRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeBody),
      });
      const creativeData = await creativeRes.json();
      if (creativeData.error) return NextResponse.json({ success: false, error: creativeData.error.message });
      const creative_id = creativeData.id;

      // Stap 4: Ad aanmaken
      const adRes = await fetch(`https://graph.facebook.com/v20.0/${AD_ACCOUNT_ID}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign_name} - Ad`,
          adset_id,
          creative: { creative_id },
          status: 'PAUSED',
          access_token: metaToken,
        }),
      });
      const adData = await adRes.json();
      if (adData.error) return NextResponse.json({ success: false, error: adData.error.message });

      return NextResponse.json({
        success: true,
        result: {
          campaign_id,
          adset_id,
          creative_id,
          ad_id: adData.id,
          message: `Campagne "${campaign_name}" aangemaakt! Staat op PAUSED — je kan hem activeren in Meta Ads Manager.`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Onbekende actie' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
