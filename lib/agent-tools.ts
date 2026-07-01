// lib/agent-tools.ts
// -----------------------------------------------------------------------------
// De "Brain"-tools die je Claude-agent kan aanroepen (Anthropic tool-use).
//
// Splitsing van verantwoordelijkheden:
//   - Live DATA ophalen + platform-ACTIES uitvoeren (Meta/TikTok/Shopify/GSC)
//     doe je via je MCP-servers (mcp_servers in de Anthropic API-call).
//   - Deze custom tools zijn het GEHEUGEN + OORDEEL: context tree lezen/schrijven,
//     findings maken, en acties VOORSTELLEN (nooit direct uitvoeren).
//
// De agent stelt voor via propose_action; jouw app voert pas uit ná jouw
// goedkeuring (zie executor-noot onderaan). Dat is de veiligheidsgarantie.
// -----------------------------------------------------------------------------
import * as db from "./db";

// ---- Tool schema's (naar Claude) -------------------------------------------
export const brainTools = [
  {
    name: "search_context",
    description:
      "Zoek in het context-geheugen van de workspace (merk-info, eerdere findings, metric-definities, campagnehistorie). Gebruik dit ALTIJD eerst voordat je conclusies trekt, zodat je context meeneemt.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "read_context",
    description: "Lees de volledige inhoud van één context-node op id.",
    input_schema: {
      type: "object",
      properties: { node_id: { type: "string" } },
      required: ["node_id"],
    },
  },
  {
    name: "write_context",
    description:
      "Sla nieuwe of bijgewerkte kennis op in het context-geheugen (bv. 'ROAS-drempel voor Meta is 2.0', of een samenvatting van wat er deze week speelde). Upsert op (parent, slug).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        slug: { type: "string", description: "url-veilige unieke sleutel binnen de parent" },
        body: { type: "string", description: "inhoud in markdown" },
        node_type: { type: "string", enum: ["folder", "note", "metric", "brand", "campaign"] },
        parent_id: { type: "string" },
      },
      required: ["title", "slug", "body"],
    },
  },
  {
    name: "create_finding",
    description:
      "Leg een concreet verbeterpunt vast. Een finding is GEEN ruwe metriek, maar een oordeel met impact — bv. 'Meta campagne 3 heeft ROAS 0.9 → verspilt ~€300/mnd'. Zet severity op basis van omzetimpact.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string", description: "bewijs + geschatte impact + aanbeveling" },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
        source: { type: "string", description: "meta | tiktok | shopify | gsc | manual" },
      },
      required: ["title", "body", "severity"],
    },
  },
  {
    name: "list_findings",
    description: "Toon bestaande findings, optioneel gefilterd op status (open/in_progress/resolved/dismissed).",
    input_schema: {
      type: "object",
      properties: { status: { type: "string" } },
    },
  },
  {
    name: "update_finding",
    description: "Werk een finding bij (bv. status naar 'resolved' of 'dismissed').",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string" },
        severity: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "propose_action",
    description:
      "Stel een concrete, uitvoerbare actie voor die de gebruiker kan goedkeuren. Voer NOOIT zelf uit — je stelt alleen voor. Beschrijf precies wat er moet gebeuren via platform + operation + params, zodat de app het na goedkeuring kan uitvoeren via de juiste MCP-connector. Geef est_revenue mee zodat acties op impact gesorteerd worden.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "bv. 'Pauzeer Meta campagne 3'" },
        description: { type: "string", description: "waarom + verwachte impact" },
        platform: { type: "string", enum: ["meta", "tiktok", "shopify", "gsc", "internal"] },
        operation: {
          type: "string",
          description: "bv. pause_campaign | update_budget | update_product | update_seo_title",
        },
        params: { type: "object", description: "alle velden die de operation nodig heeft (campaign_id, budget, product_id, nieuwe titel, ...)" },
        est_revenue: { type: "number", description: "geschatte extra omzet per maand (€)" },
        difficulty: { type: "string", enum: ["low", "medium", "high"] },
        finding_id: { type: "string", description: "optioneel: koppel aan een finding" },
      },
      required: ["title", "platform", "operation", "params"],
    },
  },
];

// ---- Dispatcher -------------------------------------------------------------
// Roep dit aan voor elke tool_use block die Claude teruggeeft.
// Retourneert een string die je als tool_result terugstuurt.
export async function runBrainTool(
  workspaceId: string,
  name: string,
  input: any
): Promise<string> {
  try {
    switch (name) {
      case "search_context":
        return json(await db.searchContext(workspaceId, input.query));
      case "read_context":
        return json(await db.readContext(input.node_id));
      case "write_context":
        return json(await db.writeContext({
          workspaceId, parentId: input.parent_id ?? null,
          title: input.title, slug: input.slug,
          nodeType: input.node_type, body: input.body,
        }));
      case "create_finding":
        return json(await db.createFinding({
          workspaceId, title: input.title, body: input.body,
          severity: input.severity, source: input.source,
        }));
      case "list_findings":
        return json(await db.listFindings(workspaceId, input.status));
      case "update_finding":
        return json(await db.updateFinding(input.id, {
          status: input.status, severity: input.severity,
        }));
      case "propose_action":
        return json(await db.proposeAction({
          workspaceId, title: input.title, description: input.description,
          platform: input.platform, operation: input.operation,
          params: input.params, estRevenue: input.est_revenue,
          difficulty: input.difficulty, findingId: input.finding_id ?? null,
        }));
      default:
        return `Onbekende tool: ${name}`;
    }
  } catch (err: any) {
    return `FOUT in ${name}: ${err.message ?? String(err)}`;
  }
}

function json(v: unknown) {
  return JSON.stringify(v, null, 2);
}

// -----------------------------------------------------------------------------
// EXECUTOR (losse stap, NIET onderdeel van de agent-loop):
// Wanneer de gebruiker in de UI op "Approve" klikt, roept je app een
// execute-route aan die:
//   1. de action ophaalt (db.listActions / by id)
//   2. status -> 'executing' zet
//   3. op basis van action.platform + action.operation de juiste MCP-tool
//      aanroept (Meta pause_campaign, Shopify productUpdate, enz.)
//   4. status -> 'executed' (met result) of 'failed' (met error) zet
// Zo blijft de agent puur adviserend en houd jij de hand aan de knop.
// -----------------------------------------------------------------------------
