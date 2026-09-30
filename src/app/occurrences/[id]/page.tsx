'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert, PriorityBadge, Spinner, Stars, StatusBadge } from '@/components/ui';
import { api, imageUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORY_LABEL, STATUS_LABEL, formatDateTime } from '@/lib/labels';
import type { Comment, OccurrenceDetail } from '@/lib/types';
import { ManagerPanel } from './ManagerPanel';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function RatingForm({ occurrence, onRated }: { occurrence: OccurrenceDetail; onRated: (o: OccurrenceDetail) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError('Selecione uma nota de 1 a 5.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onRated(
        await api(`/occurrences/${occurrence.id}/rating`, {
          method: 'POST',
          body: { rating, comment: comment || undefined },
        }),
      );
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-600">Como você avalia a resolução desta ocorrência?</p>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-1" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} estrela(s)`}
            className={`text-3xl leading-none transition ${n <= (hover || rating) ? 'text-amber-400' : 'text-slate-300'}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={2}
        maxLength={1000}
        placeholder="Comentário sobre o atendimento (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit" className="btn-primary" disabled={busy}>
        Enviar avaliação
      </button>
    </form>
  );
}

function CancelButton({ occurrence, onCancelled }: { occurrence: OccurrenceDetail; onCancelled: (o: OccurrenceDetail) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      onCancelled(await api(`/occurrences/${occurrence.id}/cancel`, { method: 'POST', body: { note } }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!open) {
    return (
      <button className="btn-danger w-full" onClick={() => setOpen(true)}>
        Cancelar ocorrência
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <label htmlFor="cancel-note" className="label">Motivo do cancelamento *</label>
      <textarea
        id="cancel-note"
        className="input"
        rows={2}
        required
        maxLength={1000}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-danger flex-1">
          Confirmar cancelamento
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Voltar
        </button>
      </div>
    </form>
  );
}

function OccurrenceView() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams().get('created');
  const { user } = useAuth();
  const [occ, setOcc] = useState<OccurrenceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    api<OccurrenceDetail>(`/occurrences/${id}`).then(setOcc).catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!occ) return;
    setSending(true);
    setCommentError(null);
    try {
      const c = await api<Comment>(`/occurrences/${occ.id}/comments`, {
        method: 'POST',
        body: { content: comment },
      });
      setOcc({ ...occ, comments: [...occ.comments, c] });
      setComment('');
    } catch (err) {
      setCommentError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!occ || !user) return <Spinner />;

  const isGestor = user.role === 'GESTOR';
  const isRequester = occ.requester.id === user.id;
  const img = imageUrl(occ.imagePath);
  const mapUrl =
    occ.latitude !== null && occ.longitude !== null
      ? `https://www.google.com/maps?q=${occ.latitude},${occ.longitude}`
      : null;

  return (
    <>
      <Link href="/occurrences" className="text-sm text-slate-500 hover:text-slate-700">
        ← Voltar para ocorrências
      </Link>

      {created && (
        <div className="mt-3">
          <Alert kind="success">Ocorrência #{occ.code} registrada com sucesso! Acompanhe o andamento por aqui.</Alert>
        </div>
      )}

      <div className="mb-5 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-400">
            #{occ.code} · {CATEGORY_LABEL[occ.category]}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{occ.title}</h1>
          <p className="text-sm text-slate-500">
            Aberta por {occ.requester.name} em {formatDateTime(occ.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={occ.priority} />
          <StatusBadge status={occ.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title="Descrição">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{occ.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Localização</dt>
                <dd className="font-medium">
                  {occ.location}
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="ml-2 text-brand-600 hover:underline">
                      ver no mapa ↗
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Responsável</dt>
                <dd className="font-medium">{occ.assignee?.name ?? 'Ainda não atribuído'}</dd>
              </div>
            </dl>
            {img && (
              <a href={img} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-lg border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Imagem da ocorrência ${occ.title}`} className="max-h-96 w-full bg-slate-100 object-contain" />
              </a>
            )}
          </Section>

          {(occ.solution || occ.status === 'RESOLVIDA') && (
            <Section title="Solução aplicada">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{occ.solution}</p>
              {occ.resolvedAt && (
                <p className="mt-2 text-xs text-slate-500">Resolvida em {formatDateTime(occ.resolvedAt)}</p>
              )}
            </Section>
          )}

          {occ.status === 'RESOLVIDA' && (occ.rating !== null || isRequester) && (
            <Section title="Avaliação da resolução">
              {occ.rating !== null ? (
                <div>
                  <Stars value={occ.rating} size="text-2xl" />
                  {occ.ratingComment && <p className="mt-2 text-sm text-slate-700">“{occ.ratingComment}”</p>}
                </div>
              ) : (
                <RatingForm occurrence={occ} onRated={setOcc} />
              )}
            </Section>
          )}

          <Section title={`Comentários (${occ.comments.length})`}>
            {occ.comments.length === 0 && <p className="text-sm text-slate-500">Nenhum comentário ainda.</p>}
            <ul className="space-y-3">
              {occ.comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{c.author.name}</span>
                    {c.author.role === 'GESTOR' && (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 font-medium text-brand-700">Gestor</span>
                    )}
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{c.content}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={addComment} className="mt-4 space-y-2">
              {commentError && <Alert>{commentError}</Alert>}
              <textarea
                aria-label="Novo comentário"
                className="input"
                rows={2}
                required
                maxLength={1000}
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={sending || !comment.trim()}>
                {sending ? 'Enviando...' : 'Comentar'}
              </button>
            </form>
          </Section>
        </div>

        <aside className="space-y-5">
          {isGestor && <ManagerPanel occurrence={occ} onUpdated={setOcc} />}
          {!isGestor && isRequester && occ.status === 'ABERTA' && (
            <div className="card p-5">
              <CancelButton occurrence={occ} onCancelled={setOcc} />
            </div>
          )}

          <Section title="Histórico de status">
            <ol className="relative ml-2 border-l border-slate-200">
              {[...occ.statusHistory].reverse().map((h) => (
                <li key={h.id} className="mb-5 ml-4 last:mb-0">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
                  <div className="text-sm font-medium">
                    {h.fromStatus ? (
                      <>
                        {STATUS_LABEL[h.fromStatus]} → {STATUS_LABEL[h.toStatus]}
                      </>
                    ) : (
                      <>Registrada como {STATUS_LABEL[h.toStatus]}</>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDateTime(h.createdAt)} · {h.changedBy.name}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{h.note}</p>
                </li>
              ))}
            </ol>
          </Section>
        </aside>
      </div>
    </>
  );
}

export default function OccurrencePage() {
  return (
    <AppShell>
      <Suspense>
        <OccurrenceView />
      </Suspense>
    </AppShell>
  );
}
