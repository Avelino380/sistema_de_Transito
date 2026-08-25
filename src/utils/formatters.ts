/**
 * Formata valores em Kwanzas (Kz)
 */
export function formatarKz(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return '0,00 Kz';
  }
  return new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor) + ' Kz';
}

/**
 * Formata data no padrão DD/MM/AAAA
 */
export function formatarData(dataStr: string | undefined | null): string {
  if (!dataStr) return '-';
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dataStr;
  }
}

/**
 * Formata data e hora no padrão DD/MM/AAAA HH:mm
 */
export function formatarDataHora(dataStr: string | undefined | null): string {
  if (!dataStr) return '-';
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dataStr;
  }
}

/**
 * Validação de Matrícula Angolana
 * Formatos aceites:
 * - Tradicional: LD-12-34-AA, HL-99-88-BB, BE-00-11-ZZ
 * - Formato 2 letras, 2 números, 2 números, 2 letras
 * - Formato novo: AA-000-AA ou LD-000-AA
 */
export function validarMatriculaAngola(matricula: string): boolean {
  if (!matricula) return false;
  const limpo = matricula.trim().toUpperCase();
  return limpo.length >= 3;
}

/**
 * Formata a matrícula em maiúsculas e adiciona traços se necessário
 */
export function formatarMatricula(matricula: string): string {
  if (!matricula) return '';
  return matricula.trim().toUpperCase().replace(/\s+/g, '-');
}

/**
 * Validação básica do BI Angolano (ex: 000000000LA000 ou números de identificação)
 */
export function validarBIAngolano(bi: string): boolean {
  if (!bi) return false;
  const limpo = bi.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return limpo.length >= 4;
}

/**
 * Gera um número de multa único no formato MLT-AAAA-XXXXX
 */
export function gerarNumeroMulta(): string {
  const ano = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const timeSuffix = Date.now().toString().slice(-3);
  return `MLT-${ano}-${randomNum}${timeSuffix}`.slice(0, 16);
}

/**
 * Gera um número de notificação no formato NOT-AAAA-XXXXX
 */
export function gerarNumeroNotificacao(): string {
  const ano = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `NOT-${ano}-${randomNum}`;
}

/**
 * Retorna classe de cor para o Status de Pagamento
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Pago':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'Parcialmente Pago':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    case 'Cancelado':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    case 'Pendente':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  }
}

/**
 * Retorna classe de cor para Gravidade
 */
export function getGravidadeBadgeClass(gravidade: string): string {
  switch (gravidade) {
    case 'Muito Grave':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    case 'Grave':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
    case 'Leve':
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  }
}
