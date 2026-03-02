import type { Ticket, Priority } from './types';

const API_BASE = 'http://localhost:3111';

export const TicketService = {
    async getTickets(): Promise<Ticket[]> {
        const res = await fetch(`${API_BASE}/tickets`);
        const data = await res.json();
        return data.tickets;
    },

    async createTicket(ticket: { title: string; description: string; priority: Priority; customerEmail: string }) {
        const res = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket),
        });
        return res.json();
    },

    async triageTicket(ticketId: string, assignee: string, priority: Priority) {
        const res = await fetch(`${API_BASE}/tickets/triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, assignee, priority }),
        });
        return res.json();
    },

    async escalateTicket(ticketId: string, reason: string) {
        const res = await fetch(`${API_BASE}/tickets/escalate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, reason }),
        });
        return res.json();
    }
};
