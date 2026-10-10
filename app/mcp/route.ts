import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_instagram_status",
    {
      title: "Instagram connection status",
      description: "Return the current setup status. This starter does not connect to Instagram or send actions yet.",
      inputSchema: z.object({}).strict(),
      outputSchema: z.object({
        connected: z.boolean(),
        automationEnabled: z.boolean(),
        nextStep: z.string()
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      const result = {
        connected: false,
        automationEnabled: false,
        nextStep: "Configure Meta OAuth and required permissions before enabling Instagram actions."
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
        structuredContent: result
      };
    }
  );

  server.registerTool(
    "get_automation_setup_checklist",
    {
      title: "Automation setup checklist",
      description: "Show the implementation checklist for this Instagram automation project.",
      inputSchema: z.object({}).strict(),
      outputSchema: z.object({
        steps: z.array(z.string())
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      const result = {
        steps: [
          "Configure PostgreSQL and run Prisma migrations.",
          "Create a Meta developer app and configure Instagram Login.",
          "Implement encrypted token storage and account authorization.",
          "Verify Meta webhooks for comments and messages.",
          "Implement supported publishing, comment replies, and eligible DM replies.",
          "Add idempotency, rate limits, audit logs, and a global pause switch.",
          "Test in a development account before enabling production automation."
        ]
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
        structuredContent: result
      };
    }
  );
});

export { handler as GET, handler as POST };
