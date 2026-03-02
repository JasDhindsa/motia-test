import { api, step } from 'motia'
import { z } from 'zod'

/**
 * Simplified EscalateTicket step: handles manual escalation request (API trigger).
 */

const manualEscalateSchema = z.object({
  ticketId: z.string(),
  reason: z.string(),
})

export const stepConfig = {
  name: 'EscalateTicket',
  description: 'Manual escalation via API',
  flows: ['support-ticket-flow'],
  triggers: [
    api('POST', '/tickets/escalate', {
      bodySchema: manualEscalateSchema,
      responseSchema: {
        200: z.object({ ticketId: z.string(), escalatedTo: z.string(), message: z.string() }),
        404: z.object({ error: z.string() }),
      },
    }),
  ],
  enqueues: [],
}

export const { config, handler } = step(stepConfig, async (input, ctx) => {
  return ctx.match({
    http: async (request) => {
      const { ticketId, reason } = request.body

      const existing = await ctx.state.get<Record<string, unknown>>('tickets', ticketId)
      if (!existing) {
        return { status: 404, body: { error: `Ticket ${ticketId} not found` } }
      }

      await ctx.state.set('tickets', ticketId, {
        ...existing,
        escalatedTo: 'engineering-lead',
        escalatedAt: new Date().toISOString(),
        escalationReason: reason,
        escalationMethod: 'manual',
        status: 'escalated'
      })

      ctx.logger.info('Manual escalation via API', { ticketId, reason })
      return {
        status: 200,
        body: { ticketId, escalatedTo: 'engineering-lead', message: 'Ticket escalated successfully' },
      }
    },
  })
})
