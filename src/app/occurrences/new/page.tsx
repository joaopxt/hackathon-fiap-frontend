'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/ui';
import { api } from '@/lib/api';
import { compressImage, validateImage } from '@/lib/image';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/labels';
import type { Category, Occurrence } from '@/lib/types';

function NewOccurrenceForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as Category | '',
    location: '',
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setImage(await compressImage(file));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Seu navegador não suporta geolocalização.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Não foi possível obter sua localização. Verifique a permissão do navegador.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    if (coords) {
      body.append('latitude', String(coords.latitude));
      body.append('longitude', String(coords.longitude));
    }
    if (image) body.append('image', image);
    try {
      const created = await api<Occurrence>('/occurrences', { method: 'POST', body });
      router.push(`/occurrences/${created.id}?created=1`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/occurrences" className="text-sm text-slate-500 hover:text-slate-700">
        ← Voltar
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold tracking-tight">Registrar ocorrência</h1>
      <p className="mb-5 text-sm text-slate-500">
        Descreva o problema com o máximo de detalhes para agilizar o atendimento.
      </p>

      <form onSubmit={onSubmit} className="card space-y-5 p-6">
        {error && <Alert>{error}</Alert>}

        <div>
          <label htmlFor="title" className="label">Título *</label>
          <input
            id="title"
            required
            maxLength={120}
            placeholder="Ex.: Lâmpada queimada no corredor"
            className="input"
            value={form.title}
            onChange={set('title')}
          />
        </div>

        <div>
          <label htmlFor="description" className="label">Descrição *</label>
          <textarea
            id="description"
            required
            maxLength={2000}
            rows={4}
            placeholder="O que está acontecendo, desde quando, riscos envolvidos..."
            className="input"
            value={form.description}
            onChange={set('description')}
          />
        </div>

        <div>
          <label htmlFor="category" className="label">Categoria *</label>
          <select id="category" required className="input" value={form.category} onChange={set('category')}>
            <option value="" disabled>
              Selecione...
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="label">Localização *</label>
          <input
            id="location"
            required
            maxLength={255}
            placeholder="Ex.: Bloco B, 3º andar, próximo ao elevador"
            className="input"
            value={form.location}
            onChange={set('location')}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <button type="button" className="btn-secondary px-3 py-1.5" onClick={useMyLocation} disabled={locating}>
              {locating ? 'Obtendo localização...' : '📍 Usar minha localização (GPS)'}
            </button>
            {coords && (
              <span className="text-slate-600">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}{' '}
                <button type="button" className="text-red-600 hover:underline" onClick={() => setCoords(null)}>
                  remover
                </button>
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="label">Imagem (opcional)</span>
          {preview ? (
            <div className="relative overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pré-visualização" className="max-h-72 w-full bg-slate-100 object-contain" />
              <button
                type="button"
                className="btn-danger absolute right-2 top-2 px-3 py-1"
                onClick={() => setImage(null)}
              >
                Remover
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 transition hover:border-brand-500 hover:bg-brand-50">
              <span className="text-2xl">📷</span>
              <span className="font-medium text-slate-700">Clique para anexar uma foto</span>
              <span>JPG, PNG, WEBP ou GIF até 5 MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onImage} />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/occurrences" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Registrar ocorrência'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewOccurrencePage() {
  return (
    <AppShell>
      <NewOccurrenceForm />
    </AppShell>
  );
}
