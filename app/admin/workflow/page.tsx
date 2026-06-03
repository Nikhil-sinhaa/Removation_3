'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, RefreshCw, Loader2, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, Edit3, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface State {
  _id:      string;
  stateId:  string;
  label:    string;
  color:    string;
  isInitial:boolean;
  isFinal:  boolean;
}

interface Transition {
  _id:           string;
  transitionId:  string;
  label:         string;
  description:   string;
  fromStates:    string[];
  toState:       string;
  allowedRoles:  string[];
  enabled:       boolean;
  order:         number;
  conditions: {
    requiresMessage: boolean;
    requiresRating:  boolean;
    requiresPayment: boolean;
  };
  effects: {
    sendNotification:       boolean;
    releasePayment:         boolean;
    refundPayment:          boolean;
    incrementProviderStats: boolean;
  };
}

interface Stats { totalEvents: number }

export default function WorkflowPage() {
  const [states,      setStates]      = useState<State[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [editTarget,  setEditTarget]  = useState<Transition | null>(null);
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/workflow');
      const data = await res.json();
      setStates(data.states || []);
      setTransitions(data.transitions || []);
      setStats(data.stats || null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTransition = async (t: Transition) => {
    await fetch(`/api/admin/workflow/transitions/${t._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !t.enabled }),
    });
    load();
    toast({ title: `Transition ${t.enabled ? 'disabled' : 'enabled'}` });
  };

  const saveTransition = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workflow/transitions/${editTarget._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedRoles: editTarget.allowedRoles,
          conditions:   editTarget.conditions,
          effects:      editTarget.effects,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Transition updated' });
      setEditTarget(null);
      load();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-purple-400" />
            Booking Workflow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure booking state machine — states, transitions, conditions, and effects.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {stats && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              {stats.totalEvents.toLocaleString()} events logged
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="transitions">
          <TabsList>
            <TabsTrigger value="transitions">Transitions ({transitions.length})</TabsTrigger>
            <TabsTrigger value="states">States ({states.length})</TabsTrigger>
          </TabsList>

          {/* Transitions */}
          <TabsContent value="transitions">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transition</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">From → To</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roles</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Conditions</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Effects</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Enabled</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transitions.map(t => (
                    <tr key={t._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.transitionId}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {t.fromStates.map(s => (
                            <span key={s} className="bg-muted px-1.5 py-0.5 rounded capitalize">{s.replace(/_/g,' ')}</span>
                          ))}
                        </div>
                        <span className="text-muted-foreground">→ </span>
                        <span className="font-medium capitalize">{t.toState.replace(/_/g,' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {t.allowedRoles.map(r => (
                            <span key={r} className="bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded capitalize">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.conditions.requiresMessage && <span className="block">✓ Requires message</span>}
                        {t.conditions.requiresRating  && <span className="block">✓ Requires rating</span>}
                        {t.conditions.requiresPayment && <span className="block">✓ Requires payment</span>}
                        {!t.conditions.requiresMessage && !t.conditions.requiresRating && !t.conditions.requiresPayment && '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.effects.sendNotification       && <span className="block">📧 Email</span>}
                        {t.effects.releasePayment         && <span className="block">💳 Release payment</span>}
                        {t.effects.refundPayment          && <span className="block">↩ Refund</span>}
                        {t.effects.incrementProviderStats && <span className="block">📈 Update stats</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleTransition(t)}>
                          {t.enabled
                            ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                            : <ToggleLeft  className="h-5 w-5 text-neutral-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditTarget({ ...t })} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* States */}
          <TabsContent value="states">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">State</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Initial</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {states.map(s => (
                    <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.stateId}</td>
                      <td className="px-4 py-3 text-center">
                        {s.isInitial ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.isFinal ? <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit transition dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Transition: {editTarget?.label}</DialogTitle>
            <DialogDescription className="font-mono text-xs">{editTarget?.transitionId}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="mb-2 block">Allowed Roles (comma-separated)</Label>
                <Input
                  value={editTarget.allowedRoles.join(', ')}
                  onChange={e => setEditTarget({ ...editTarget, allowedRoles: e.target.value.split(',').map(r => r.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <Label className="mb-2 block">Conditions</Label>
                <div className="space-y-2">
                  {(['requiresMessage','requiresRating','requiresPayment'] as const).map(cond => (
                    <div key={cond} className="flex items-center gap-2">
                      <Checkbox
                        checked={editTarget.conditions[cond]}
                        onCheckedChange={v => setEditTarget({ ...editTarget, conditions: { ...editTarget.conditions, [cond]: !!v } })}
                      />
                      <span className="text-sm capitalize">{cond.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Effects</Label>
                <div className="space-y-2">
                  {(['sendNotification','releasePayment','refundPayment','incrementProviderStats'] as const).map(eff => (
                    <div key={eff} className="flex items-center gap-2">
                      <Checkbox
                        checked={editTarget.effects[eff]}
                        onCheckedChange={v => setEditTarget({ ...editTarget, effects: { ...editTarget.effects, [eff]: !!v } })}
                      />
                      <span className="text-sm capitalize">{eff.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveTransition} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
