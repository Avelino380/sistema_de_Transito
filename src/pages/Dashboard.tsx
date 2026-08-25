import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Car,
  Calendar,
  Filter,
  Plus,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Multa, Pagamento, Condutor, Viatura } from '../types';
import { formatarKz } from '../utils/formatters';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  multas: Multa[];
  pagamentos: Pagamento[];
  condutores: Condutor[];
  viaturas: Viatura[];
  onNavigate: (page: PageId) => void;
  onOpenNovaMulta: () => void;
  onOpenNovoPagamento: () => void;
}

type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'ano' | 'todos' | 'personalizado';

const COLORS_STATUS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
const COLORS_GRAVIDADE = ['#64748B', '#F97316', '#EF4444'];
const COLORS_INFRACOES = ['#D97706', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#4B5563'];

export const Dashboard: React.FC<DashboardProps> = ({
  multas,
  pagamentos,
  condutores,
  viaturas,
  onNavigate,
  onOpenNovaMulta,
  onOpenNovoPagamento,
}) => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  // Filtragem por período
  const multasFiltradas = useMemo(() => {
    const agora = new Date();
    const hojeStr = agora.toISOString().split('T')[0];

    return multas.filter((m) => {
      if (!m.dataMulta) return true;
      const dataM = new Date(m.dataMulta);

      if (periodo === 'hoje') {
        return m.dataMulta.startsWith(hojeStr);
      }
      if (periodo === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(agora.getDate() - 7);
        return dataM >= umaSemanaAtras;
      }
      if (periodo === 'mes') {
        return (
          dataM.getFullYear() === agora.getFullYear() &&
          dataM.getMonth() === agora.getMonth()
        );
      }
      if (periodo === 'ano') {
        return dataM.getFullYear() === agora.getFullYear();
      }
      if (periodo === 'personalizado') {
        if (dataInicio && m.dataMulta < dataInicio) return false;
        if (dataFim && m.dataMulta > dataFim) return false;
        return true;
      }
      return true; // 'todos'
    });
  }, [multas, periodo, dataInicio, dataFim]);

  // Cálculos estatísticos
  const totalMultas = multasFiltradas.length;
  const multasPagas = multasFiltradas.filter((m) => m.statusPagamento === 'Pago').length;
  const multasPendentes = multasFiltradas.filter(
    (m) => m.statusPagamento === 'Pendente' || m.statusPagamento === 'Parcialmente Pago'
  ).length;

  const totalArrecadado = multasFiltradas.reduce((acc, m) => acc + (m.valorPago || 0), 0);
  const totalPorCobrar = multasFiltradas.reduce((acc, m) => acc + (m.saldoDevedor || 0), 0);

  // Hoje e Este Mês (Geral)
  const agora = new Date();
  const hojeStr = agora.toISOString().split('T')[0];
  const multasHoje = multas.filter((m) => m.dataMulta?.startsWith(hojeStr)).length;
  const multasEsteMes = multas.filter((m) => {
    if (!m.dataMulta) return false;
    const d = new Date(m.dataMulta);
    return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
  }).length;

  // Dados para Gráfico 1: Multas por Mês
  const dadosMultasPorMes = useMemo(() => {
    const mesesMap: { [key: string]: { mes: string; multas: number; arrecadado: number } } = {};
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Inicializar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesesMap[chave] = {
        mes: `${nomesMeses[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`,
        multas: 0,
        arrecadado: 0,
      };
    }

    multas.forEach((m) => {
      if (m.dataMulta) {
        const chave = m.dataMulta.slice(0, 7);
        if (mesesMap[chave]) {
          mesesMap[chave].multas += 1;
          mesesMap[chave].arrecadado += m.valorPago || 0;
        }
      }
    });

    return Object.values(mesesMap);
  }, [multas]);

  // Dados para Gráfico 2: Pagas vs Pendentes
  const dadosStatusPizza = useMemo(() => {
    const contagem: { [key: string]: number } = {
      Pago: 0,
      'Parcialmente Pago': 0,
      Pendente: 0,
      Cancelado: 0,
    };
    multasFiltradas.forEach((m) => {
      if (contagem[m.statusPagamento] !== undefined) {
        contagem[m.statusPagamento]++;
      }
    });
    return [
      { name: 'Pagas', value: contagem['Pago'] },
      { name: 'Parciais', value: contagem['Parcialmente Pago'] },
      { name: 'Pendentes', value: contagem['Pendente'] },
      { name: 'Canceladas', value: contagem['Cancelado'] },
    ].filter((item) => item.value > 0);
  }, [multasFiltradas]);

  // Dados para Gráfico 3: Infrações Mais Frequentes
  const dadosInfracoes = useMemo(() => {
    const freq: { [key: string]: number } = {};
    multasFiltradas.forEach((m) => {
      const tipo = m.tipoInfracao || 'Outra';
      freq[tipo] = (freq[tipo] || 0) + 1;
    });

    return Object.entries(freq)
      .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '...' : name, fullName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [multasFiltradas]);

  // Dados para Gráfico 4: Gravidade
  const dadosGravidade = useMemo(() => {
    const counts = { Leve: 0, Grave: 0, 'Muito Grave': 0 };
    multasFiltradas.forEach((m) => {
      if (m.gravidade === 'Leve') counts.Leve++;
      if (m.gravidade === 'Grave') counts.Grave++;
      if (m.gravidade === 'Muito Grave') counts['Muito Grave']++;
    });
    return [
      { name: 'Leve', value: counts.Leve },
      { name: 'Grave', value: counts.Grave },
      { name: 'Muito Grave', value: counts['Muito Grave'] },
    ].filter((item) => item.value > 0);
  }, [multasFiltradas]);

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Header with Filter Controls and Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Painel Executivo de Trânsito
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitorização em tempo real de infrações, arrecadação fiscal e frota
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(
              [
                { id: 'hoje', label: 'Hoje' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mês' },
                { id: 'ano', label: 'Este Ano' },
                { id: 'todos', label: 'Tudo' },
                { id: 'personalizado', label: 'Personalizado' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                id={`filter-periodo-${opt.id}`}
                onClick={() => setPeriodo(opt.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodo === opt.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <input
                id="filter-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                id="filter-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              id="dash-btn-nova-multa"
              onClick={onOpenNovaMulta}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registar Multa
            </button>
            <button
              id="dash-btn-novo-pagamento"
              onClick={onOpenNovoPagamento}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Novo Pagamento
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Multas */}
        <div
          id="kpi-total-multas"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Multas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {totalMultas}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Hoje: <strong>{multasHoje}</strong></span>
              <span>•</span>
              <span>Este mês: <strong>{multasEsteMes}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Multas Pagas */}
        <div
          id="kpi-multas-pagas"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Multas Pagas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {multasPagas}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {totalMultas > 0
                ? `${Math.round((multasPagas / totalMultas) * 100)}% de taxa de resolução`
                : 'Nenhum registo no período'}
            </p>
          </div>
        </div>

        {/* Card 3: Multas Pendentes */}
        <div
          id="kpi-multas-pendentes"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Multas Pendentes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {multasPendentes}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Em fase de cobrança voluntária/coerciva
            </p>
          </div>
        </div>

        {/* Card 4: Total Arrecadado */}
        <div
          id="kpi-total-arrecadado"
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Arrecadado
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatarKz(totalArrecadado)}
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Por cobrar: <strong className="text-red-500">{formatarKz(totalPorCobrar)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics (Condutores, Viaturas, Registos) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('condutores')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Condutores</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{condutores.length}</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('viaturas')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Viaturas</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{viaturas.length}</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('multas')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Multas Hoje</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{multasHoje}</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('relatorios')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Multas Este Mês</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{multasEsteMes}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Multas Registadas e Arrecadação por Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multas Registadas por Mês
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evolução semestral do volume de autos
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMultasPorMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="multas" name="Nº Multas" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Valores Arrecadados por Mês */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Valores Arrecadados por Mês (Kz)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receita cobrada em coimas
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosMultasPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArrecadado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number | string | undefined) => [formatarKz(Number(val) || 0), 'Arrecadado']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="arrecadado"
                  name="Arrecadação"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorArrecadado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Multas Pagas vs Pendentes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multas Pagas vs Pendentes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribuição percentual do estado das coimas
              </p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-64">
            {dadosStatusPizza.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosStatusPizza}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dadosStatusPizza.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum dado para o período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Multas por Gravidade */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multas por Gravidade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Leves, Graves e Muito Graves
              </p>
            </div>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="h-64">
            {dadosGravidade.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGravidade}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {dadosGravidade.map((entry, index) => (
                      <Cell key={`cell-grav-${index}`} fill={COLORS_GRAVIDADE[index % COLORS_GRAVIDADE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum dado para o período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Infrações Mais Frequentes Table & Ranking */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Infrações Mais Frequentes (Top 5)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tipologia com maior incidência no período selecionado
            </p>
          </div>
          <button
            id="ver-todas-multas-btn"
            onClick={() => onNavigate('multas')}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver Todas as Multas <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {dadosInfracoes.length > 0 ? (
            dadosInfracoes.map((inf, idx) => {
              const perc = totalMultas > 0 ? Math.round((inf.count / totalMultas) * 100) : 0;
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {inf.fullName}
                      </p>
                      <div className="w-48 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {inf.count}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1">autos ({perc}%)</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">
              Nenhuma infração registrada no filtro selecionado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
