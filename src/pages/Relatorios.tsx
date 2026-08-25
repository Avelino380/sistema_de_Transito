import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Multa, Pagamento } from '../types';
import { formatarData, formatarKz, getStatusBadgeClass } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RelatoriosProps {
  multas: Multa[];
  pagamentos: Pagamento[];
}

type TipoRelatorio =
  | 'periodo'
  | 'agente'
  | 'infracao'
  | 'pagas'
  | 'pendentes'
  | 'arrecadacao';

export const Relatorios: React.FC<RelatoriosProps> = ({ multas, pagamentos }) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('periodo');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [agenteFiltro, setAgenteFiltro] = useState<string>('todos');

  // Lista de agentes únicos presentes nos dados
  const listaAgentes = useMemo(() => {
    const agentes = new Set<string>();
    multas.forEach((m) => {
      if (m.agenteNome) agentes.add(m.agenteNome);
    });
    return Array.from(agentes);
  }, [multas]);

  // Multas filtradas pelo período selecionado
  const multasFiltradas = useMemo(() => {
    return multas.filter((m) => {
      if (filtroDataInicio && m.dataMulta < filtroDataInicio) return false;
      if (filtroDataFim && m.dataMulta > filtroDataFim) return false;
      if (agenteFiltro !== 'todos' && m.agenteNome !== agenteFiltro) return false;

      if (tipoRelatorio === 'pagas' && m.statusPagamento !== 'Pago') return false;
      if (
        tipoRelatorio === 'pendentes' &&
        m.statusPagamento !== 'Pendente' &&
        m.statusPagamento !== 'Parcialmente Pago'
      )
        return false;

      return true;
    });
  }, [multas, filtroDataInicio, filtroDataFim, agenteFiltro, tipoRelatorio]);

  // Agrupamentos e Cálculos
  const totalMultas = multasFiltradas.length;
  const totalValor = multasFiltradas.reduce((acc, m) => acc + (m.valorTotal || 0), 0);
  const totalArrecadado = multasFiltradas.reduce((acc, m) => acc + (m.valorPago || 0), 0);
  const totalSaldoDevedor = multasFiltradas.reduce((acc, m) => acc + (m.saldoDevedor || 0), 0);

  // Agrupamento por Agente
  const relatorioPorAgente = useMemo(() => {
    const map: { [agente: string]: { agente: string; qtd: number; totalKz: number; arrecadadoKz: number } } = {};
    multasFiltradas.forEach((m) => {
      const nome = m.agenteNome || 'Não Atribuído';
      if (!map[nome]) {
        map[nome] = { agente: nome, qtd: 0, totalKz: 0, arrecadadoKz: 0 };
      }
      map[nome].qtd += 1;
      map[nome].totalKz += m.valorTotal || 0;
      map[nome].arrecadadoKz += m.valorPago || 0;
    });
    return Object.values(map).sort((a, b) => b.qtd - a.qtd);
  }, [multasFiltradas]);

  // Agrupamento por Infração
  const relatorioPorInfracao = useMemo(() => {
    const map: { [tipo: string]: { tipo: string; gravidade: string; qtd: number; totalKz: number } } = {};
    multasFiltradas.forEach((m) => {
      const tipo = m.tipoInfracao || 'Outra';
      if (!map[tipo]) {
        map[tipo] = { tipo, gravidade: m.gravidade, qtd: 0, totalKz: 0 };
      }
      map[tipo].qtd += 1;
      map[tipo].totalKz += m.valorTotal || 0;
    });
    return Object.values(map).sort((a, b) => b.qtd - a.qtd);
  }, [multasFiltradas]);

  // Exportar para PDF com jsPDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const tituloRelatorio =
      tipoRelatorio === 'periodo'
        ? 'Relatório Geral de Multas por Período'
        : tipoRelatorio === 'agente'
        ? 'Relatório de Eficácia por Agente Autuante'
        : tipoRelatorio === 'infracao'
        ? 'Relatório de Incidência por Tipo de Infração'
        : tipoRelatorio === 'pagas'
        ? 'Relatório de Multas Liquidadas / Pagas'
        : tipoRelatorio === 'pendentes'
        ? 'Relatório de Multas Pendentes de Cobrança'
        : 'Relatório de Arrecadação Fiscal';

    // Header oficial
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPÚBLICA DE ANGOLA', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text('POLÍCIA NACIONAL DE ANGOLA - DTSER', 105, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tituloRelatorio.toUpperCase(), 105, 29, { align: 'center' });
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-AO')} | Registos: ${totalMultas}`, 105, 35, { align: 'center' });

    doc.line(14, 38, 196, 38);

    // Sumário Financeiro
    doc.setFontSize(9);
    doc.text(`Total Faturado: ${formatarKz(totalValor)}`, 14, 44);
    doc.text(`Total Arrecadado: ${formatarKz(totalArrecadado)}`, 85, 44);
    doc.text(`Saldo em Falta: ${formatarKz(totalSaldoDevedor)}`, 145, 44);

    if (tipoRelatorio === 'agente') {
      autoTable(doc, {
        startY: 50,
        head: [['Agente Autuante', 'Qtd Autos', 'Total Faturado (Kz)', 'Total Cobrado (Kz)']],
        body: relatorioPorAgente.map((a) => [a.agente, a.qtd, formatarKz(a.totalKz), formatarKz(a.arrecadadoKz)]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
      });
    } else if (tipoRelatorio === 'infracao') {
      autoTable(doc, {
        startY: 50,
        head: [['Tipo de Infração', 'Gravidade', 'Qtd Ocorrências', 'Volume Coimas (Kz)']],
        body: relatorioPorInfracao.map((i) => [i.tipo, i.gravidade, i.qtd, formatarKz(i.totalKz)]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
      });
    } else {
      autoTable(doc, {
        startY: 50,
        head: [['Nº Auto', 'Data', 'Condutor / BI', 'Matrícula', 'Infração', 'Valor', 'Estado']],
        body: multasFiltradas.map((m) => [
          m.numeroMulta,
          formatarData(m.dataMulta),
          `${m.nomeCondutor || m.bi}`,
          m.matricula,
          m.tipoInfracao,
          formatarKz(m.valorTotal),
          m.statusPagamento,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`Relatorio_Multas_${tipoRelatorio}_${Date.now()}.pdf`);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div id="relatorios-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-amber-500" />
            Relatórios Oficiais & Mapas Estatísticos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geração de balanços por período, agentes, infrações e arrecadação fiscal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-imprimir-relatorio"
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            id="btn-exportar-pdf"
            onClick={exportarPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 no-print">
        {/* Report Types Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {(
            [
              { id: 'periodo', label: 'Multas por Período' },
              { id: 'agente', label: 'Multas por Agente' },
              { id: 'infracao', label: 'Multas por Infração' },
              { id: 'pagas', label: 'Multas Pagas' },
              { id: 'pendentes', label: 'Multas Pendentes' },
              { id: 'arrecadacao', label: 'Balanço de Arrecadação' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              id={`tab-relatorio-${tab.id}`}
              onClick={() => setTipoRelatorio(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tipoRelatorio === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date and Agent Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Data Início
            </label>
            <input
              id="relatorio-data-inicio"
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Data Fim
            </label>
            <input
              id="relatorio-data-fim"
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filtrar por Agente
            </label>
            <select
              id="relatorio-filtro-agente"
              value={agenteFiltro}
              onChange={(e) => setAgenteFiltro(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="todos">Todos os Agentes</option>
              {listaAgentes.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total de Registos</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalMultas}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Volume Total de Coimas</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate">{formatarKz(totalValor)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Arrecadação Efectiva</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">{formatarKz(totalArrecadado)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Saldo Remanescente</p>
          <p className="text-xl font-black text-red-500 mt-1 truncate">{formatarKz(totalSaldoDevedor)}</p>
        </div>
      </div>

      {/* Report Data Representation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden printable-area">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {tipoRelatorio === 'periodo' && 'Mapa Geral de Multas por Período'}
              {tipoRelatorio === 'agente' && 'Balanço de Autos por Agente de Trânsito'}
              {tipoRelatorio === 'infracao' && 'Mapa Estatístico por Tipo de Infração'}
              {tipoRelatorio === 'pagas' && 'Relação de Multas Liquidadas'}
              {tipoRelatorio === 'pendentes' && 'Relação de Multas Pendentes de Pagamento'}
              {tipoRelatorio === 'arrecadacao' && 'Balanço Global de Arrecadação de Coimas'}
            </h3>
            <p className="text-xs text-slate-400">
              Emitido em {new Date().toLocaleDateString('pt-AO')} • {totalMultas} registos no mapa
            </p>
          </div>
        </div>

        {/* Table representation based on type */}
        <div className="overflow-x-auto">
          {tipoRelatorio === 'agente' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Agente Autuante</th>
                  <th className="py-3 px-4">Qtd. Autos</th>
                  <th className="py-3 px-4">Volume Faturado</th>
                  <th className="py-3 px-4">Arrecadado</th>
                  <th className="py-3 px-4 text-right">Taxa Cobrança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {relatorioPorAgente.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{a.agente}</td>
                    <td className="py-3 px-4 font-bold">{a.qtd}</td>
                    <td className="py-3 px-4">{formatarKz(a.totalKz)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{formatarKz(a.arrecadadoKz)}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {a.totalKz > 0 ? `${Math.round((a.arrecadadoKz / a.totalKz) * 100)}%` : '0%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tipoRelatorio === 'infracao' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Tipo de Infração</th>
                  <th className="py-3 px-4">Gravidade</th>
                  <th className="py-3 px-4">Ocorrências</th>
                  <th className="py-3 px-4 text-right">Volume Total (Kz)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {relatorioPorInfracao.map((inf, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{inf.tipo}</td>
                    <td className="py-3 px-4">{inf.gravidade}</td>
                    <td className="py-3 px-4 font-bold">{inf.qtd}</td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">{formatarKz(inf.totalKz)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Nº Auto</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Condutor / BI</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Infração</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Pago</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {multasFiltradas.length > 0 ? (
                  multasFiltradas.map((m) => (
                    <tr key={m.id || m.numeroMulta} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{m.numeroMulta}</td>
                      <td className="py-3 px-4">{formatarData(m.dataMulta)}</td>
                      <td className="py-3 px-4 font-medium">{m.nomeCondutor || m.bi}</td>
                      <td className="py-3 px-4 font-mono font-bold">{m.matricula}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{m.tipoInfracao}</td>
                      <td className="py-3 px-4 font-bold">{formatarKz(m.valorTotal)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{formatarKz(m.valorPago || 0)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(m.statusPagamento)}`}>
                          {m.statusPagamento}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhum registo atende aos critérios deste relatório.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
