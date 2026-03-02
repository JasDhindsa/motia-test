import { api, queue, step } from 'motia';
import { z } from 'zod';

/**
 * Simplified TriageTicket step: handles manual re-triage via API.
 */

const manualTriageSchema = z.object({
  ticketId: z.string(),
  assignee: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export const stepConfig = {
  name: 'TriageTicket',
  description: 'Auto-triage from queue or manual triage via API',
  flows: ['support-ticket-flow'],
  triggers: [
    queue('ticket::created'), // Re-establishes the connection for the "Flow" page
    api('POST', '/tickets/triage', {
      bodySchema: manualTriageSchema,
      responseSchema: {
        200: z.object({
          ticketId: z.string(),
          assignee: z.string(),
          status: z.string(),
        }),
        404: z.object({ error: z.string() }),
      },
    }),
  ],
  enqueues: [],
};

export const { config, handler } = step(stepConfig, async (input, ctx) => {
  return ctx.match({
    queue: async (queueInput: any) => {
      const { ticketId, priority } = queueInput;
      ctx.logger.info('Auto-triaging ticket from queue', { ticketId });

      const existing = await ctx.state.get<Record<string, unknown>>('tickets', ticketId);
      if (!existing) return;

      const assignee = priority === 'critical' || priority === 'high' ? 'senior-lead' : 'support-agent';

      await ctx.state.set('tickets', ticketId, {
        ...existing,
        triagedAt: new Date().toISOString(),
        assignee,
        status: 'triaged',
        triageMethod: 'auto'
      });
    },

    http: async (request: any) => {
      const { ticketId, assignee, priority } = request.body;
      const existing = await ctx.state.get<Record<string, unknown>>('tickets', ticketId);
      if (!existing) {
        return { status: 404, body: { error: `Ticket ${ticketId} not found` } };
      }
      ctx.logger.info('Manual triage via API', { ticketId, assignee });

      await ctx.state.set('tickets', ticketId, {
        ...existing,
        triagedAt: new Date().toISOString(),
        assignee,
        priority,
        status: 'triaged',
        triageMethod: 'manual'
      });

      return { status: 200, body: { ticketId, assignee, status: 'triaged' } };
    },
  });
});
