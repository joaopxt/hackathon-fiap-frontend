import { describe, expect, it } from 'vitest';
import { extractErrorMessage, toQuery } from './api';
import { fitWithin, validateImage } from './image';
import { STATUS_TRANSITIONS, formatDuration } from './labels';

describe('api helpers', () => {
  it('monta query string ignorando valores vazios', () => {
    expect(toQuery({ status: 'ABERTA', category: '', page: 2, x: undefined })).toBe(
      '?status=ABERTA&page=2',
    );
    expect(toQuery({})).toBe('');
  });

  it('extrai mensagens de erro do Nest', () => {
    expect(extractErrorMessage({ message: ['a', 'b'] }, 'x')).toBe('a. b');
    expect(extractErrorMessage({ message: 'falhou' }, 'x')).toBe('falhou');
    expect(extractErrorMessage(null, 'padrão')).toBe('padrão');
  });
});

describe('imagens', () => {
  it('valida tipo e tamanho', () => {
    expect(validateImage({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateImage({ type: 'application/pdf', size: 1000 })).toMatch(/Formato/);
    expect(validateImage({ type: 'image/jpeg', size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });

  it('redimensiona mantendo a proporção', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 3200)).toEqual({ width: 500, height: 1600 });
  });
});

describe('labels', () => {
  it('formata durações', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0.5)).toBe('30 min');
    expect(formatDuration(5)).toBe('5,0 h');
    expect(formatDuration(72)).toBe('3,0 dias');
  });

  it('estados finais não têm transições (exceto reabertura)', () => {
    expect(STATUS_TRANSITIONS.CANCELADA).toEqual([]);
    expect(STATUS_TRANSITIONS.RESOLVIDA).toEqual(['EM_ATENDIMENTO']);
  });
});
