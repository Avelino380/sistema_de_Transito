import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { LogAuditoria } from '../types';
import { formatarDataHora } from '../utils/formatters';

interface AuditoriaProps {
  logs: LogAuditoria[];
}

export const Auditoria: React.FC<AuditoriaProps> = ({ logs }) => {
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<string>('todos');
  const [filtroRecurso, setFiltroRecurso] = useState<string>('todos');

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      if (busca) {
        const q = busca.toLowerCase().trim();
        const bate =
          log.utilizadorNome.toLowerCase().includes(q) ||
          log.utilizadorEmail.toLowerCase().includes(q) ||
          (log.detalhes && log.detalhes.toLowerCase().includes(q)) ||
          (log.documentoId && log.documentoId.toLowerCase().includes(q));
        if (!bate) return false;
      }

      if (filtroAcao !== 'todos' && log.acao !== filtroAcao) {
        return false;
      }

      if (filtroRecurso !== 'todos' && log.recurso !== filtroRecurso) {
        return false;
      }

      return true;
    });
  }, [logs, busca, filtroAcao, filtroRecurso]);

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'Criação':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Edição':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Exclusão':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Pagamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Alteração de Permissões':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'Login':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300';
    }
  };

  return (
    <div id="auditoria-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Registo de Auditoria & Conformidade
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rastreabilidade detalhada de todas as operações, alterações, liquidações e acessos ao sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-auditoria-input"
              type="text"
              placeholder="Pesquisar utilizador, acção, ID..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-60 sm:w-72 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <select
            id="filtro-acao-auditoria"
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todas as Acções</option>
            <option value="Criação">Criação de Registo</option>
            <option value="Edição">Edição de Registo</option>
            <option value="Exclusão">Exclusão de Registo</option>
            <option value="Pagamento">Registo de Pagamento</option>
            <option value="Alteração de Permissões">Permissões</option>
            <option value="Login">Autenticação</option>
          </select>

          <select
            id="filtro-recurso-auditoria"
            value={filtroRecurso}
            onChange={(e) => setFiltroRecurso(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos os Recursos</option>
            <option value="multas">Multas</option>
            <option value="pagamentos">Pagamentos</option>
            <option value="condutores">Condutores</option>
            <option value="viaturas">Viaturas</option>
            <option value="utilizadores">Utilizadores</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Utilizador Responsável</th>
                <th className="py-3.5 px-4">Acção</th>
                <th className="py-3.5 px-4">Recurso</th>
                <th className="py-3.5 px-4">Descrição da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {logsFiltrados.length > 0 ? (
                logsFiltrados.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {formatarDataHora(log.dataHora)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{log.utilizadorNome}</p>
                      <p className="text-[10px] text-slate-400">{log.utilizadorEmail}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getAcaoBadge(log.acao)}`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                      {log.recurso}
                    </td>
                    <td className="py-3 px-4 max-w-md font-medium text-slate-800 dark:text-slate-200">
                      {log.detalhes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nenhum registo de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
