/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Circle, 
  X,
  AlertCircle,
  Layout
} from 'lucide-react';

// --- Types ---

type Priority = 'low' | 'medium' | 'high';
type Status = 'open' | 'in-progress' | 'closed';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: number;
}

// --- Constants ---

const COLUMNS: { id: Status; label: string; icon: any }[] = [
  { id: 'open', label: 'Open', icon: Circle },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
  { id: 'closed', label: 'Closed', icon: CheckCircle2 },
];

const PRIORITY_COLORS = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const PRIORITY_BAR_COLORS = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

// --- Utilities ---

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('novatask_issues');
    if (saved) {
      try {
        setIssues(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load issues", e);
      }
    } else {
      // Add sample data for first-time users
      const samples: Issue[] = [
        {
          id: generateId(),
          title: 'Welcome to NovaTask',
          description: 'This is a sample issue. You can drag it between columns to update its status.',
          status: 'open',
          priority: 'low',
          createdAt: Date.now()
        },
        {
          id: generateId(),
          title: 'Implement drag-and-drop',
          description: 'Test the fluidity of the Kanban board by moving this card to "In Progress".',
          status: 'in-progress',
          priority: 'high',
          createdAt: Date.now() - 3600000
        },
        {
          id: generateId(),
          title: 'Setup local persistence',
          description: 'Verify that your changes persist after a page refresh.',
          status: 'closed',
          priority: 'medium',
          createdAt: Date.now() - 86400000
        }
      ];
      setIssues(samples);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('novatask_issues', JSON.stringify(issues));
  }, [issues]);

  const addIssue = (data: Partial<Issue>) => {
    const newIssue: Issue = {
      id: generateId(),
      title: data.title || 'Untitled Issue',
      description: data.description || '',
      status: data.status || 'open',
      priority: data.priority || 'medium',
      createdAt: Date.now(),
    };
    setIssues((prev) => [newIssue, ...prev]);
  };

  const updateIssue = (id: string, updates: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((issue) => (issue.id === id ? { ...issue, ...updates } : issue))
    );
  };

  const deleteIssue = (id: string) => {
    if (window.confirm('Delete this issue?')) {
      setIssues((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIssueId(id);
    e.dataTransfer.setData('issueId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('issueId') || draggedIssueId;
    if (id) {
      updateIssue(id, { status });
    }
    setDraggedIssueId(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">NovaTask</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Local-First Kanban Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex space-x-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span className="flex items-center px-2 py-1 rounded bg-zinc-800/50 border border-zinc-800">{issues.length} Total</span>
            <span className="flex items-center px-2 py-1 rounded bg-zinc-800/50 border border-zinc-800">{issues.filter(i => i.status !== 'closed').length} Pending</span>
          </div>
          <button 
            onClick={() => {
              setEditingIssue(null);
              setIsModalOpen(true);
            }}
            className="group bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-8 bg-gradient-to-b from-[#09090b] to-[#020202]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {COLUMNS.map((col) => (
            <div 
              key={col.id} 
              className="flex flex-col min-w-0"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center ${
                  col.id === 'open' ? 'text-zinc-400' : 
                  col.id === 'in-progress' ? 'text-indigo-400' : 'text-emerald-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    col.id === 'open' ? 'bg-zinc-500' : 
                    col.id === 'in-progress' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse' : 'bg-emerald-500'
                  }`}></span> 
                  {col.label}
                </h2>
                <span className="text-xs text-zinc-600 font-mono">
                  {issues.filter(i => i.status === col.id).length.toString().padStart(2, '0')}
                </span>
              </div>

              <div className={`flex flex-col gap-4 min-h-[500px] rounded-xl transition-all p-1 ${
                col.id === 'in-progress' ? 'border-x border-zinc-800/20 bg-zinc-900/10' : ''
              }`}>
                <AnimatePresence initial={false}>
                  {issues
                    .filter((issue) => issue.status === col.id)
                    .map((issue) => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        onEdit={() => {
                          setEditingIssue(issue);
                          setIsModalOpen(true);
                        }}
                        onDelete={() => deleteIssue(issue.id)}
                        onDragStart={(e) => onDragStart(e, issue.id)}
                      />
                    ))}
                </AnimatePresence>
                
                {issues.filter(i => i.status === col.id).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 font-mono rounded-xl opacity-20 py-12">
                    <p className="text-[10px] uppercase tracking-widest font-bold">No Records</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-8 py-4 bg-[#0c0c0e] border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            LOCAL SYNC ACTIVE
          </div>
          <div className="hidden sm:block h-4 w-px bg-zinc-800"></div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">
            STORAGE: {Math.round(JSON.stringify(issues).length / 1024 * 10) / 10}KB USED
          </div>
        </div>
        <div className="text-[10px] font-mono text-zinc-600 tracking-wider">
          v1.2.4-STABLE // PERSISTENCE LAYER READY
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function IssueCard({ issue, onEdit, onDelete, onDragStart }: { 
  issue: Issue; 
  onEdit: () => void; 
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  key?: string;
}) {
  const isPending = issue.status !== 'closed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      draggable
      onDragStart={onDragStart}
      className={`group p-5 rounded-xl border relative overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing ${
        issue.status === 'in-progress' 
          ? 'bg-[#1f1f23] border-indigo-500/30 shadow-2xl shadow-indigo-500/5 ring-1 ring-indigo-500/20'
          : issue.status === 'closed'
            ? 'bg-[#18181b] border-zinc-800/50 opacity-60 grayscale hover:grayscale-0'
            : 'bg-[#18181b] border-zinc-800/50 shadow-xl'
      }`}
    >
      {/* Accent Bar */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        issue.status === 'in-progress' ? 'bg-indigo-500' :
        issue.status === 'closed' ? 'bg-emerald-500' :
        PRIORITY_BAR_COLORS[issue.priority]
      }`} />

      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${PRIORITY_COLORS[issue.priority]}`}>
          {issue.priority}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-zinc-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 hover:bg-rose-500/10 rounded-full transition-colors text-zinc-500 hover:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h3 className={`text-sm font-semibold mb-2 leading-snug tracking-tight ${issue.status === 'closed' ? 'line-through' : ''}`}>
        {issue.title}
      </h3>
      
      {issue.description && (
        <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-3">
          {issue.description}
        </p>
      )}

      {issue.status === 'in-progress' && (
        <div className="mt-4 flex items-center group-hover:opacity-80 transition-opacity">
           <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[65%] h-full bg-indigo-500 animate-pulse"></div>
           </div>
           <span className="ml-2 text-[8px] font-mono text-zinc-500">ACTIVE</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/50">
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
          #{issue.id.slice(0, 4).toUpperCase()}
        </span>
        {issue.status === 'closed' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <span className="text-[10px] font-mono text-zinc-600">
            {new Date(issue.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function IssueModal({ issue, onSubmit, onClose }: { 
  issue: Issue | null; 
  onSubmit: (data: Partial<Issue>) => void; 
  onClose: () => void 
}) {
  const [title, setTitle] = useState(issue?.title || '');
  const [description, setDescription] = useState(issue?.description || '');
  const [priority, setPriority] = useState<Priority>(issue?.priority || 'medium');
  const [status, setStatus] = useState<Status>(issue?.status || 'open');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden ring-1 ring-zinc-700/50"
      >
        <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-[#1f1f23]">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {issue ? 'Dispatch Override' : 'New Instance'}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Issue Record Initialization</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmit({ title, description, priority, status });
        }} className="p-7 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Issue Designation</label>
              <input 
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-zinc-100 placeholder:text-zinc-700"
                placeholder="Identify the fault..."
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Comprehensive Brief</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-zinc-100 resize-none placeholder:text-zinc-700"
                placeholder="Technical specifications and context..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Priority Scalar</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-wider rounded-lg border transition-all ${
                        priority === p 
                          ? PRIORITY_COLORS[p] 
                          : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Status Matrix</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none transition-all"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-[10px] uppercase font-bold tracking-widest bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all text-zinc-400"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-[2] px-4 py-3 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-30 active:scale-[0.98]"
            >
              {issue ? 'Apply System Update' : 'Initialize Record'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
