// index-dev.js
import { Motia, initIII } from "motia";

// src/triage-ticket.step.ts
import { api, queue, step } from "motia";
import { z } from "zod";
var manualTriageSchema = z.object({
  ticketId: z.string(),
  assignee: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"])
});
var stepConfig = {
  name: "TriageTicket",
  description: "Auto-triage from queue or manual triage via API",
  flows: ["support-ticket-flow"],
  triggers: [
    queue("ticket::created"),
    // Re-establishes the connection for the "Flow" page
    api("POST", "/tickets/triage", {
      bodySchema: manualTriageSchema,
      responseSchema: {
        200: z.object({
          ticketId: z.string(),
          assignee: z.string(),
          status: z.string()
        }),
        404: z.object({ error: z.string() })
      }
    })
  ],
  enqueues: []
};
var { config, handler } = step(stepConfig, async (input, ctx) => {
  return ctx.match({
    queue: async (queueInput) => {
      const { ticketId, priority } = queueInput;
      ctx.logger.info("Auto-triaging ticket from queue", { ticketId });
      const existing = await ctx.state.get("tickets", ticketId);
      if (!existing) return;
      const assignee = priority === "critical" || priority === "high" ? "senior-lead" : "support-agent";
      await ctx.state.set("tickets", ticketId, {
        ...existing,
        triagedAt: (/* @__PURE__ */ new Date()).toISOString(),
        assignee,
        status: "triaged",
        triageMethod: "auto"
      });
    },
    http: async (request) => {
      const { ticketId, assignee, priority } = request.body;
      const existing = await ctx.state.get("tickets", ticketId);
      if (!existing) {
        return { status: 404, body: { error: `Ticket ${ticketId} not found` } };
      }
      ctx.logger.info("Manual triage via API", { ticketId, assignee });
      await ctx.state.set("tickets", ticketId, {
        ...existing,
        triagedAt: (/* @__PURE__ */ new Date()).toISOString(),
        assignee,
        priority,
        status: "triaged",
        triageMethod: "manual"
      });
      return { status: 200, body: { ticketId, assignee, status: "triaged" } };
    }
  });
});

// src/list-tickets.step.ts
import { z as z2 } from "zod";
var config2 = {
  name: "ListTickets",
  description: "Returns all tickets from state",
  flows: ["support-ticket-flow"],
  triggers: [
    {
      type: "http",
      method: "GET",
      path: "/tickets",
      responseSchema: {
        200: z2.object({
          tickets: z2.array(z2.record(z2.string(), z2.any())),
          count: z2.number()
        })
      }
    }
  ],
  enqueues: []
};
var handler2 = async (_, { state, logger }) => {
  const tickets = await state.list("tickets");
  logger.info("Listing tickets", { count: tickets.length });
  return {
    status: 200,
    body: { tickets, count: tickets.length }
  };
};

// src/escalate-ticket.step.ts
import { api as api2, step as step2 } from "motia";
import { z as z3 } from "zod";
var manualEscalateSchema = z3.object({
  ticketId: z3.string(),
  reason: z3.string()
});
var stepConfig2 = {
  name: "EscalateTicket",
  description: "Manual escalation via API",
  flows: ["support-ticket-flow"],
  triggers: [
    api2("POST", "/tickets/escalate", {
      bodySchema: manualEscalateSchema,
      responseSchema: {
        200: z3.object({ ticketId: z3.string(), escalatedTo: z3.string(), message: z3.string() }),
        404: z3.object({ error: z3.string() })
      }
    })
  ],
  enqueues: []
};
var { config: config3, handler: handler3 } = step2(stepConfig2, async (input, ctx) => {
  return ctx.match({
    http: async (request) => {
      const { ticketId, reason } = request.body;
      const existing = await ctx.state.get("tickets", ticketId);
      if (!existing) {
        return { status: 404, body: { error: `Ticket ${ticketId} not found` } };
      }
      await ctx.state.set("tickets", ticketId, {
        ...existing,
        escalatedTo: "engineering-lead",
        escalatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        escalationReason: reason,
        escalationMethod: "manual",
        status: "escalated"
      });
      ctx.logger.info("Manual escalation via API", { ticketId, reason });
      return {
        status: 200,
        body: { ticketId, escalatedTo: "engineering-lead", message: "Ticket escalated successfully" }
      };
    }
  });
});

// src/create-ticket.step.ts
import { z as z4 } from "zod";
var ticketSchema = z4.object({
  title: z4.string(),
  description: z4.string(),
  priority: z4.enum(["low", "medium", "high", "critical"]),
  customerEmail: z4.string()
});
var config4 = {
  name: "CreateTicket",
  description: "Accepts a new support ticket via API and enqueues it for triage",
  flows: ["support-ticket-flow"],
  triggers: [
    {
      type: "http",
      method: "POST",
      path: "/tickets",
      bodySchema: ticketSchema,
      responseSchema: {
        200: z4.object({
          ticketId: z4.string(),
          status: z4.string(),
          message: z4.string()
        }),
        400: z4.object({ error: z4.string() })
      }
    }
  ],
  enqueues: ["ticket::created"]
};
var handler4 = async (request, { enqueue, logger, state }) => {
  const { title, description, priority, customerEmail } = request.body;
  if (!title || !description) {
    return {
      status: 400,
      body: { error: "Title and description are required" }
    };
  }
  const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const ticket = {
    id: ticketId,
    title,
    description,
    priority,
    customerEmail,
    status: "open",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await state.set("tickets", ticketId, ticket);
  logger.info("Ticket created", { ticketId, priority });
  await enqueue({
    topic: "ticket::created",
    data: { ticketId, title, priority, customerEmail }
  });
  return {
    status: 200,
    body: {
      ticketId,
      status: "open",
      message: "Ticket created and queued for triage"
    }
  };
};

// index-dev.js
initIII();
var motia = new Motia();
motia.addStep(config, "./src/triage-ticket.step.ts", handler, "./src/triage-ticket.step.ts");
motia.addStep(config2, "./src/list-tickets.step.ts", handler2, "./src/list-tickets.step.ts");
motia.addStep(config3, "./src/escalate-ticket.step.ts", handler3, "./src/escalate-ticket.step.ts");
motia.addStep(config4, "./src/create-ticket.step.ts", handler4, "./src/create-ticket.step.ts");
motia.initialize();
//# sourceMappingURL=index-dev.js.map
