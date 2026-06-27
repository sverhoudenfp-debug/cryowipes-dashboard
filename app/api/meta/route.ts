import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.META_ACCESS_TOKEN;
    const accountId = 'act_1315459333262567';

    const [insightsRes, campaignsRes, accountRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v20.0/${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc&date_preset=last_7d&access_token=${token}`),
      fetch(`https://graph.facebook.com/v20.0/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${token}`),
      fetch(`https://graph.facebook.com/v20.0/${accountId}?fields=balance,currency,amount_spent,funding_source_details&access_token=${token}`),
    ]);

    const [insightsData, campaignsData, accountData] = await Promise.all([
      insightsRes.json(),
      campaignsRes.json(),
      accountRes.json(),
    ]);

    const insights = insightsData.data?.[0] || {};
    const currency = accountData.currency || 'USD';

    // Probeer prepaid saldo op te halen via funding_source_details
    // Als dat niet werkt, val terug op balance veld
    let balance = '0.00';
    if (accountData.funding_source_details?.amount) {
      balance = (accountData.funding_source_details.amount / 100).toFixed(2);
    } else if (accountData.balance && parseInt(accountData.balance) > 0) {
      balance = (parseInt(accountData.balance) / 100).toFixed(2);
    }

    return NextResponse.json({
      spend: insights.spend || '0',
      impressions: insights.impressions || '0',
      clicks: insights.clicks || '0',
      ctr: insights.ctr || '0',
      cpc: insights.cpc || '0',
      campaigns: campaignsData.data || [],
      balance,
      currency,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
