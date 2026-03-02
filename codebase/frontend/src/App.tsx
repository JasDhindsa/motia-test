import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ticket, Priority } from './types';
import { TicketService } from './TicketService';
import './App.css'; // Assuming some shared styles here, but index.css has the bulk

const App = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'tickets'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await TicketService.getTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      // Done loading
    }
  };


  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    high: tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    triaged: tickets.filter(t => t.status === 'triaged' || t.status === 'escalated').length
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="brand">
          <div className="logo-icon">M</div>
          <span>Motia Support</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <TicketIcon size={20} /> All Tickets
          </button>
          <button className="nav-item">
            <Users size={20} /> Team
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-primary w-full" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle size={18} /> New Ticket
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="content-header">
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="text-muted">Manage and monitor customer issues in real-time.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search tickets..." />
            </div>
            <button className="btn btn-secondary"><Filter size={18} /> Filter</button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-view"
          >
            <div className="stats-grid">
              <StatCard title="Total Tickets" value={stats.total} icon={<TicketIcon color="var(--accent-primary)" />} />
              <StatCard title="Open/Pending" value={stats.open} icon={<Clock color="var(--color-medium)" />} trend="+2" />
              <StatCard title="Critical/High" value={stats.high} icon={<AlertCircle color="var(--color-critical)" />} />
              <StatCard title="Resolved/Triaged" value={stats.triaged} icon={<CheckCircle2 color="var(--color-success)" />} trend="85%" />
            </div>

            <div className="recent-activity card">
              <div className="card-header">
                <h2>Priority Tickets</h2>
                <button className="text-link">View all</button>
              </div>
              <div className="ticket-list">
                {tickets.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 5).map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tickets' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="tickets-view"
          >
            <div className="ticket-list-container card">
              <div className="list-header">
                <span>ID</span>
                <span>TITLE</span>
                <span>STATUS</span>
                <span>PRIORITY</span>
                <span>CREATED</span>
                <span></span>
              </div>
              <div className="ticket-list">
                {tickets.map(ticket => (
                  <TicketRow key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateTicketModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => { setIsCreateModalOpen(false); fetchTickets(); }}
          />
        )}
        {selectedTicket && (
          <TicketDetailsModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdated={fetchTickets}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend }: any) => (
  <div className="card stat-item">
    <div className="stat-header">
      <div className="stat-icon">{icon}</div>
      {trend && <span className={`stat-trend ${trend.startsWith('+') ? 'positive' : ''}`}>{trend}</span>}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-title">{title}</div>
  </div>
);

const TicketRow = ({ ticket, onClick }: { ticket: Ticket, onClick: () => void }) => (
  <motion.div
    whileHover={{ x: 4 }}
    className="ticket-row"
    onClick={onClick}
  >
    <span className="ticket-id">#{ticket.id.split('-').pop()}</span>
    <div className="ticket-info">
      <div className="ticket-title">{ticket.title}</div>
      <div className="ticket-email text-muted">{ticket.customerEmail}</div>
    </div>
    <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
    <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
    <span className="text-muted">{new Date(ticket.createdAt).toLocaleDateString()}</span>
    <ChevronRight className="text-muted" size={18} />
  </motion.div>
);

const CreateTicketModal = ({ onClose, onSuccess }: any) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, customerEmail: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await TicketService.createTicket(form);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal card">
        <header>
          <h2>Create New Ticket</h2>
          <p className="text-muted">Fill out the details below to open a new support request.</p>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Email</label>
            <input type="email" required value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="customer@example.com" />
          </div>
          <div className="form-group">
            <label>Ticket Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief summary of the issue" />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={4} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed explanation..."></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TicketDetailsModal = ({ ticket, onClose, onUpdated }: { ticket: Ticket, onClose: () => void, onUpdated: () => void }) => {
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');

  const handleTriage = async () => {
    await TicketService.triageTicket(ticket.id, 'agent-007', ticket.priority);
    onUpdated();
    onClose();
  };

  const handleEscalate = async () => {
    if (!escalationReason) return;
    await TicketService.escalateTicket(ticket.id, escalationReason);
    onUpdated();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
      <motion.div layoutId={ticket.id} className="modal detail-modal card">
        <div className="detail-header">
          <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
        </div>

        <h1>{ticket.title}</h1>
        <div className="ticket-meta">
          <p><strong>ID:</strong> {ticket.id}</p>
          <p><strong>Customer:</strong> {ticket.customerEmail}</p>
          <p><strong>Reported:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>

        <div className="detail-section">
          <h3>Description</h3>
          <p className="description-text">{ticket.description}</p>
        </div>

        {ticket.status === 'open' && (
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={handleTriage}>Triage Ticket</button>
            <button className="btn btn-secondary" onClick={() => setIsEscalating(true)}>Escalate</button>
          </div>
        )}

        {isEscalating && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="escalation-form">
            <textarea
              placeholder="Reason for escalation..."
              value={escalationReason}
              onChange={e => setEscalationReason(e.target.value)}
            />
            <div className="escalation-actions">
              <button className="btn btn-primary btn-sm" onClick={handleEscalate}>Confirm Escalation</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEscalating(false)}>Cancel</button>
            </div>
          </motion.div>
        )}

        {ticket.status === 'escalated' && (
          <div className="alert-box info">
            <p><strong>Escalated To:</strong> {ticket.escalatedTo}</p>
            <p><strong>Reason:</strong> {ticket.escalationReason}</p>
          </div>
        )}

        <button className="close-btn" onClick={onClose}>×</button>
      </motion.div>
    </motion.div>
  );
}

export default App;
