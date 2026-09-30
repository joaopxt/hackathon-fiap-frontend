'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/labels';
import type { Role, User } from '@/lib/types';

function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api<User[]>('/users').then(setUsers).catch((e) => setError(e.message));
  }, []);

  async function changeRole(u: User, role: Role) {
    setError(null);
    setSuccess(null);
    try {
      const updated = await api<User>(`/users/${u.id}/role`, { method: 'PATCH', body: { role } });
      setUsers((list) => list?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      setSuccess(`${u.name} agora é ${role === 'GESTOR' ? 'gestor' : 'solicitante'}.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const q = filter.trim().toLowerCase();
  const visible = users?.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.includes(q));

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-sm text-slate-500">Promova solicitantes a gestores para que possam administrar ocorrências.</p>
      </div>
      <div className="mb-4 space-y-3">
        {error && <Alert>{error}</Alert>}
        {success && <Alert kind="success">{success}</Alert>}
        <input
          type="search"
          className="input max-w-sm"
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {!visible ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Perfil de ${u.name}`}
                      className="input w-auto py-1"
                      value={u.role}
                      disabled={u.id === me?.id}
                      title={u.id === me?.id ? 'Você não pode alterar o próprio perfil' : undefined}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                    >
                      <option value="SOLICITANTE">Solicitante</option>
                      <option value="GESTOR">Gestor</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function UsersPage() {
  return (
    <AppShell roles={['GESTOR']}>
      <Users />
    </AppShell>
  );
}
