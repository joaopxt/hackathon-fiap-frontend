'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Alert } from '@/components/ui';
import { api } from '@/lib/api';
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_TRANSITIONS,
} from '@/lib/labels';
import type { OccurrenceDetail, Priority, Status, UserSummary } from '@/lib/types';

interface Props {
  occurrence: OccurrenceDetail;
  onUpdated: (o: OccurrenceDetail) => void;
}

/** Ações exclusivas do gestor: prioridade, responsável, status e solução. */
export function ManagerPanel({ occurrence, onUpdated }: Props) {
  const [gestores, setGestores] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const transitions = STATUS_TRANSITIONS[occurrence.status];
  const [nextStatus, setNextStatus] = useState<Status | ''>('');
  const [note, setNote] = useState('');
  const [solution, setSolution] = useState(occurrence.solution ?? '');
  const [editingSolution, setEditingSolution] = useState(false);

  useEffect(() => {
    api<UserSummary[]>('/users?role=GESTOR').then(setGestores).catch(() => {});
  }, []);

  useEffect(() => {
    setNextStatus('');
    setNote('');
    setSolution(occurrence.solution ?? '');
  }, [occurrence.status, occurrence.solution]);

  async function run(action: () => Promise<OccurrenceDetail>, message: string) {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      onUpdated(await action());
      setSuccess(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const base = `/occurrences/${occurrence.id}`;

  function changePriority(priority: Priority) {
    run(
      () => api(`${base}/priority`, { method: 'PATCH', body: { priority } }),
      'Prioridade atualizada.',
    );
  }

  function changeAssignee(assigneeId: string) {
    run(
      () => api(`${base}/assignee`, { method: 'PATCH', body: { assigneeId: assigneeId || null } }),
      assigneeId ? 'Responsável atribuído.' : 'Responsável removido.',
    );
  }

  function submitStatus(e: FormEvent) {
    e.preventDefault();
    if (!nextStatus) return;
    run(
      () =>
        api(`${base}/status`, {
          method: 'PATCH',
          body: {
            status: nextStatus,
            note,
            ...(nextStatus === 'RESOLVIDA' ? { solution } : {}),
          },
        }),
      `Status alterado para ${STATUS_LABEL[nextStatus]}.`,
    );
  }

  function submitSolution(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const updated = await api<OccurrenceDetail>(`${base}/solution`, {
        method: 'PATCH',
        body: { solution },
      });
      setEditingSolution(false);
      return updated;
    }, 'Solução registrada.');
  }

  return (
    <div className="card space-y-5 p-5">
      <h2 className="font-semibold">Gestão da ocorrência</h2>
      {error && <Alert>{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      <div>
        <label htmlFor="priority" className="label">Prioridade</label>
        <select
          id="priority"
          className="input"
          value={occurrence.priority}
          disabled={busy}
          onChange={(e) => changePriority(e.target.value as Priority)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="assignee" className="label">Responsável</label>
        <select
          id="assignee"
          className="input"
          value={occurrence.assignee?.id ?? ''}
          disabled={busy}
          onChange={(e) => changeAssignee(e.target.value)}
        >
          <option value="">Sem responsável</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={submitStatus} className="space-y-3 border-t border-slate-100 pt-5">
        <label htmlFor="status" className="label">Atualizar status</label>
        {transitions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ocorrência {STATUS_LABEL[occurrence.status].toLowerCase()}: não há transições disponíveis.
          </p>
        ) : (
          <>
            <select
              id="status"
              className="input"
              required
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as Status)}
            >
              <option value="" disabled>
                {STATUS_LABEL[occurrence.status]} → selecione...
              </option>
              {transitions.map((s) => (
                <option key={s} value={s}>
                  {occurrence.status === 'RESOLVIDA' && s === 'EM_ATENDIMENTO' ? 'Reabrir (Em atendimento)' : STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {nextStatus === 'RESOLVIDA' && (
              <div>
                <label htmlFor="solution-new" className="label">Solução aplicada *</label>
                <textarea
                  id="solution-new"
                  className="input"
                  rows={3}
                  required
                  maxLength={2000}
                  placeholder="Descreva o que foi feito para resolver"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="note" className="label">Observação da alteração *</label>
              <textarea
                id="note"
                className="input"
                rows={2}
                required
                maxLength={1000}
                placeholder="Ex.: Equipe de manutenção acionada"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy || !nextStatus}>
              Salvar alteração
            </button>
          </>
        )}
      </form>

      {occurrence.status !== 'CANCELADA' && nextStatus !== 'RESOLVIDA' && (
        <div className="border-t border-slate-100 pt-5">
          {editingSolution ? (
            <form onSubmit={submitSolution} className="space-y-3">
              <label htmlFor="solution-edit" className="label">Solução aplicada</label>
              <textarea
                id="solution-edit"
                className="input"
                rows={3}
                required
                maxLength={2000}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1" disabled={busy}>
                  Salvar solução
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingSolution(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button className="btn-secondary w-full" onClick={() => setEditingSolution(true)}>
              {occurrence.solution ? 'Editar solução aplicada' : 'Registrar solução aplicada'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
