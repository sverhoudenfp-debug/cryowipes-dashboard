// lib/agent.ts
// -----------------------------------------------------------------------------
// De agent-loop: stuurt een gesprek naar Claude mét de brain-tools + MCP-servers
// en handelt tool-calls af in een lus tot Claude een eindantwoord geeft.
// -----------------------------------------------------------------------------
import Anthropic from "@anthropic-ai/sdk";
import { brainTools, runBrainTool } from "./agent-tools";
import { getWorkspaceId } from "./db";
import { getMcpServers } from "./mcp";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM = `Je bent de AI Chief Marketing Officer voor deze webshop. Je hebt live toegang tot marketing-, advertentie- en e-commercedata via tools, plus een context-geheugen.

WERKWIJZE:
1. Begin ELK verzoek met search_context om relevante achtergrond op te halen (merk-info, drempels, eerdere findings). Neem die context mee.
2. Haal de benodigde live data op via de beschikbare MCP-tools (Shopify, Meta, TikTok, Supermetrics). Vraag alleen op wat je nodig hebt.
3. Vertaal data naar OORDELEN, niet naar ruwe cijfers. Niet "CTR = 0,4%", maar "deze advertentie presteert ondermaats en verspilt ~€X/maand — pauzeren".
4. Leg belangrijke problemen vast met create_finding. Zet severity op basis van omzetimpact (critical/high/medium/low).
5. Stel concrete verbeteringen voor met propose_action. Voer NOOIT zelf iets uit — je stelt voor, de gebruiker keurt goed. Vul est_revenue in zodat alles op impact gesorteerd wordt.
6. Sla nieuwe, blijvende inzichten op met write_context (bv. drempels, wat deze week speelde), zodat je slimmer wordt over tijd.

ELK ADVIES BEVAT:
- Samenvatting (1 zin)
- Bewijs (de data waarop je je baseert)
- Zakelijke impact (geschatte extra omzet of bespaarde spend per maand)
- Zekerheid (hoog/midden/laag)
- Aanbevolen actie
- Moeilijkheid + verwachte doorlooptijd

Prioriteer altijd op impact: het duurste probleem eerst. Wees concreet en beknopt. Antwoord in de taal van de gebruiker.`;

type Msg = Anthropic.Messages.MessageParam;

export async function runAgent(opts: {
  workspaceSlug: string;
  messages: Msg[];
  maxTurns?: number;
}) {
  const { workspaceSlug, messages, maxTurns = 12 } = opts;
  const workspaceId = await getWorkspaceId(workspaceSlug);
  const mcpServers = getMcpServers();

  const convo: Msg[] = [...messages];

  for (let turn = 0; turn < maxTurns; turn++) {
    const res = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      tools: brainTools as any,
      ...(mcpServers.length ? { mcp_servers: mcpServers as any } : {}),
      messages: convo,
      betas: ["mcp-client-2025-04-04"],
    });

    const customToolUses = res.content.filter(
      (b: any) => b.type === "tool_use"
    ) as Anthropic.Messages.ToolUseBlock[];

    convo.push({ role: "assistant", content: res.content });

    if (res.stop_reason !== "tool_use" || customToolUses.length === 0) {
      const text = res.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
      return { text, messages: convo, stopReason: res.stop_reason };
    }

    const toolResults = [];
    for (const tu of customToolUses) {
      const output = await runBrainTool(workspaceId, tu.name, tu.input);
      toolResults.push({
        type: "tool_result" as const,
        tool_use_id: tu.id,
        content: output,
      });
    }
    convo.push({ role: "user", content: toolResults as any });
  }

  return {
    text: "De agent bereikte het maximale aantal stappen zonder af te ronden.",
    messages: convo,
    stopReason: "max_turns",
  };
}
