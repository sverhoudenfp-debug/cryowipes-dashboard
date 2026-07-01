// lib/db.ts
// -----------------------------------------------------------------------------
// Data-access laag voor de Brain: context tree, findings, tasks, actions.
// Gebruikt de Supabase service-role key -> alleen server-side aanroepen
// (API routes, cron, server actions). NOOIT importeren in client components.
// -----------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ---- Workspaces -------------------------------------------------------------
export async function getWorkspaceId(slug: string): Promise<string> {
  const { data, error } = await supabase
    .from("workspaces").select("id").eq("slug", slug).single();
  if (error) throw new Error(`workspace '${slug}' niet gevonden: ${error.message}`);
  return data.id;
}

// ---- Context tree -----------------------------------------------------------
export async function browseContext(workspaceId: string, parentId: string | null = null) {
  const q = supabase.from("context_nodes")
    .select("id, parent_id, title, slug, node_type, updated_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("title");
  const { data, error } = parentId
    ? await q.eq("parent_id", parentId)
    : await q.is("parent_id", null);
  if (error) throw error;
  return data;
}

export async function readContext(nodeId: string) {
  const { data, error } = await supabase
    .from("context_nodes").select("*").eq("id", nodeId).single();
  if (error) throw error;
  return data;
}

export async function searchContext(workspaceId: string, query: string) {
  const { data, error } = await supabase
    .from("context_nodes")
    .select("id, title, node_type, body")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .textSearch(
      "title", query, { type: "websearch", config: "simple" }
    );
  if (error) {
    // fallback op ilike als tsvector niks geeft
    const { data: d2 } = await supabase
      .from("context_nodes")
      .select("id, title, node_type, body")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .or(`title.ilike.%${query}%,body.ilike.%${query}%`);
    return d2 ?? [];
  }
  return data;
}

export async function writeContext(input: {
  workspaceId: string; parentId?: string | null;
  title: string; slug: string; nodeType?: string; body?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.from("context_nodes")
    .upsert({
      workspace_id: input.workspaceId,
      parent_id: input.parentId ?? null,
      title: input.title,
      slug: input.slug,
      node_type: input.nodeType ?? "note",
      body: input.body ?? "",
      metadata: input.metadata ?? {},
    }, { onConflict: "workspace_id,parent_id,slug" })
    .select().single();
  if (error) throw error;
  return data;
}

export async function archiveContext(nodeId: string) {
  const { error } = await supabase.from("context_nodes")
    .update({ archived_at: new Date().toISOString() }).eq("id", nodeId);
  if (error) throw error;
  return { archived: true };
}

// ---- Findings ---------------------------------------------------------------
export async function listFindings(workspaceId: string, status?: string) {
  let q = supabase.from("findings").select("*")
    .eq("workspace_id", workspaceId)
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createFinding(input: {
  workspaceId: string; title: string; body?: string;
  severity?: "low" | "medium" | "high" | "critical";
  source?: string; contextNodeId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.from("findings").insert({
    workspace_id: input.workspaceId,
    title: input.title,
    body: input.body ?? "",
    severity: input.severity ?? "medium",
    source: input.source ?? "agent",
    context_node_id: input.contextNodeId ?? null,
    metadata: input.metadata ?? {},
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateFinding(id: string, patch: {
  status?: string; severity?: string; title?: string; body?: string;
}) {
  const { data, error } = await supabase.from("findings")
    .update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ---- Tasks (queue) ----------------------------------------------------------
export async function enqueueTask(input: {
  workspaceId: string; prompt: string; priority?: number; scheduledFor?: string;
}) {
  const { data, error } = await supabase.from("tasks").insert({
    workspace_id: input.workspaceId,
    prompt: input.prompt,
    priority: input.priority ?? 0,
    scheduled_for: input.scheduledFor ?? new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function claimNextTask(workspaceId: string) {
  const { data, error } = await supabase
    .rpc("claim_next_task", { p_workspace: workspaceId });
  if (error) throw error;
  return (data && data[0]) ?? null;   // null = queue leeg
}

export async function completeTask(id: string, result: string, findingIds: string[] = []) {
  const { error } = await supabase.from("tasks").update({
    status: "completed", result, findings: findingIds,
    completed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function queueStatus(workspaceId: string) {
  const { data, error } = await supabase.from("tasks")
    .select("status").eq("workspace_id", workspaceId);
  if (error) throw error;
  const counts: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, failed: 0 };
  for (const row of data) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}

// ---- Agent actions (propose -> approve -> execute) --------------------------
export async function proposeAction(input: {
  workspaceId: string; title: string; description?: string;
  platform: "meta" | "tiktok" | "shopify" | "gsc" | "internal";
  operation: string; params?: Record<string, unknown>;
  estRevenue?: number; difficulty?: "low" | "medium" | "high";
  findingId?: string | null; autoExecutable?: boolean;
}) {
  const { data, error } = await supabase.from("agent_actions").insert({
    workspace_id: input.workspaceId,
    finding_id: input.findingId ?? null,
    title: input.title,
    description: input.description ?? "",
    platform: input.platform,
    operation: input.operation,
    params: input.params ?? {},
    est_revenue: input.estRevenue ?? null,
    difficulty: input.difficulty ?? "medium",
    auto_executable: input.autoExecutable ?? false,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function listActions(workspaceId: string, status = "pending") {
  const { data, error } = await supabase.from("agent_actions")
    .select("*").eq("workspace_id", workspaceId).eq("status", status)
    .order("est_revenue", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function setActionStatus(id: string, status: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.from("agent_actions")
    .update({ status, ...extra }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export { supabase };
