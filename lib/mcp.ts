// lib/mcp.ts
export type McpServer = {
  type: "url";
  name: string;
  url: string;
  authorization_token?: string;
};

export function getMcpServers(): McpServer[] {
  const servers: McpServer[] = [];

  const add = (name: string, url?: string, token?: string) => {
    if (!url) return;
    servers.push({
      type: "url",
      name,
      url,
      ...(token ? { authorization_token: token } : {}),
    });
  };

  add("shopify", process.env.SHOPIFY_MCP_URL, process.env.SHOPIFY_MCP_TOKEN);
  add("meta", process.env.META_MCP_URL, process.env.META_MCP_TOKEN);
  add("tiktok", process.env.TIKTOK_MCP_URL, process.env.TIKTOK_MCP_TOKEN);
  add("supermetrics", process.env.SUPERMETRICS_MCP_URL, process.env.SUPERMETRICS_MCP_TOKEN);

  return servers;
}
