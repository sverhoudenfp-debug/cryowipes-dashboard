import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `Je bent de AI manager voor CryoWipes (cryowipes.store), een cooling skincare webshop van Silivjn.
Je kan helpen met:
1. ADS BEHEER - TikTok Ads en Meta Ads analyseren en optimaliseren
2. SHOPIFY STATISTIEKEN - omzet, bestellingen en producten bijhouden
3. SEO OPTIMALISATIE - productpagina titels en beschrijvingen verbeteren
4. SOCIAL MEDIA - content suggesties, captions en hashtags voor TikTok en Instagram

Shopify winkel: cryowipes.myshopify.com
TikTok Ads account: 7643583810621194257
Meta Ads account: act_1315459333262567

Antwoord altijd in het Nederlands. Wees direct en concreet.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      mcp_servers: [
        {
          type: 'url',
          url: 'https://setup.shopify.com/mcp',
          name: 'shopify',
        }
      ],
    } as any);

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ content: text });
  } catch (error: any) {
    return NextResponse.json({ content: 'Er ging iets mis: ' + error.message }, { status: 500 });
  }
}
