import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const accountId = 'act_1315459333262567';
    const token = process.env.META_ACCESS_TOKEN;
    
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${accountId}/insights?fields=spend,impressions,clicks,ctr&date_preset=last_7d&access_token=${token}`
    );
    const data = await res.json();
    const insights = data.data?.[0] || {};
    
    return NextResponse.json({
      spend: insights.spend || '0',
      impressions: insights.impressions || '0',
      clicks: insights.clicks || '0',
      ctr: insights.ctr || '0',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
