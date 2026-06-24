import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `Je bent de AI manager voor CryoWipes (cryowipes.store), een cooling skincare webshop van Silivjn.

Je kan helpen met:
1. ADS BEHEER - TikTok Ads (7643583810621194257) en Meta Ads (act_1315459333262567) analyseren en optimaliseren
2. SHOPIFY STATISTIEKEN - omzet, bestellingen en producten bijhouden
3. SEO OPTIMALISATIE - productpagina titels en beschrijvingen verbeteren
4. SOCIAL MEDIA - content suggesties, captions en hashtags voor TikTok en Instagram

Huidige data (laatste 7 dagen):
- Shopify omzet: €570, 9 bestellingen
- Bestseller: Cryo wipe starter set
- TikTok: 10.339 impressies, 13 clicks, €8,10 spend, 0 conversies
- Meta: vrijwel inactief, €2,89 spend

Antwoord altijd in het Nederlands. Wees direct en concreet.`;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  return NextResponse.json({ 
    content: response.content[0].type === 'text' ? response.content[0].text : '' 
  });
}