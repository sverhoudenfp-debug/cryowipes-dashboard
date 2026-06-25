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
