import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldAlert,
  Users,
  Car,
  CreditCard,
  FileText,
  ArrowRight,
  Filter,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Multa, Condutor, Viatura, Pagamento } from '../types';
import { formatarData, formatarKz, getStatusBadgeClass, getGravidadeBadgeClass } from '../utils/formatters';

interface PesquisaGlobalProps {
  multas: Multa[];
  condutores: Condutor[];
  viaturas: Viatura[];
  pagamentos: Pagamento[];
  onOpenAutoNoticia: (multa: Multa) => void;
  onOpenRecibo: (pagamento: Pagamento, multa?: Multa) => void;
  onOpenCondutor: (condutor: Condutor) => void;
  onOpenViatura: (viatura: Viatura) => void;
}

export const PesquisaGlobal: React.FC<PesquisaGlobalProps> = ({
  multas,
  condutores,
  viaturas,
  pagamentos,
  onOpenAutoNoticia,
  onOpenRecibo,
  onOpenCondutor,
  onOpenViatura,
}) => {
  const [termo, setTermo] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<'tudo' | 'multas' | 'condutores' | 'viaturas' | 'pagamentos'>('tudo');

  const termoLimpo = termo.toLowerCase().trim();

  // Multas Encontradas
  const multasEncontradas = useMemo(() => {
    if (!termoLimpo) return [];
    return multas.filter(
      (m) =>
        m.numeroMulta.toLowerCase().includes(termoLimpo) ||
        m.bi.toLowerCase().includes(termoLimpo) ||
        (m.nomeCondutor && m.nomeCondutor.toLowerCase().includes(termoLimpo)) ||
        m.matricula.toLowerCase().includes(termoLimpo) ||
        (m.numeroCarta && m.numeroCarta.toLowerCase().includes(termoLimpo)) ||
        m.statusPagamento.toLowerCase().includes(termoLimpo) ||
        m.tipoInfracao.toLowerCase().includes(termoLimpo)
    );
  }, [multas, termoLimpo]);

  // Condutores Encontrados
  const condutoresEncontrados = useMemo(() => {
    if (!termoLimpo) return [];
    return condutores.filter(
      (c) =>
        c.nome.toLowerCase().includes(termoLimpo) ||
        c.bi.toLowerCase().includes(termoLimpo) ||
        c.numeroCarta.toLowerCase().includes(termoLimpo) ||
        c.telefone.toLowerCase().includes(termoLimpo) ||
        c.email.toLowerCase().includes(termoLimpo)
    );
  }, [condutores, termoLimpo]);

  // Viaturas Encontradas
  const viaturasEncontradas = useMemo(() => {
    if (!termoLimpo) return [];
    return viaturas.filter(
      (v) =>
        v.matricula.toLowerCase().includes(termoLimpo) ||
        v.marca.toLowerCase().includes(termoLimpo) ||
        v.modelo.toLowerCase().includes(termoLimpo) ||
        (v.proprietarioNome && v.proprietarioNome.toLowerCase().includes(termoLimpo)) ||
        (v.proprietarioBi && v.proprietarioBi.toLowerCase().includes(termoLimpo))
    );
  }, [viaturas, termoLimpo]);

  // Pagamentos Encontrados
  const pagamentosEncontrados = useMemo(() => {
    if (!termoLimpo) return [];
    return pagamentos.filter(
      (p) =>
        p.numeroMulta.toLowerCase().includes(termoLimpo) ||
        p.referencia.toLowerCase().includes(termoLimpo) ||
        p.metodoPagamento.toLowerCase().includes(termoLimpo)
    );
  }, [pagamentos, termoLimpo]);

  const totalResultados =
    multasEncontradas.length +
    condutoresEncontrados.length +
    viaturasEncontradas.length +
    pagamentosEncontrados.length;

  return (
    <div id="pesquisa-global-container" className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-lg border border-slate-800 space-y-4">
        <div className="max-w-2xl">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full font-bold text-xs border border-amber-500/30">
            Base de Dados Integrada
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Pesquisa Global do Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Localize instantaneamente por Número de Multa, BI, Nome, Matrícula de Angola, Carta de Condução ou Estado do Pagamento.
          </p>
        </div>

        {/* Global Input */}
        <div className="relative max-w-3xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="input-pesquisa-global"
            type="text"
            autoFocus
            placeholder="Digite o Nº da Multa (ex: MLT-2026-..), BI, Matrícula (ex: LD-..), Nome ou Carta..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white/20 transition-all font-medium"
          />
          {termo && (
            <button
              onClick={() => setTermo('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 pt-2">
          {(
            [
              { id: 'tudo', label: `Todos (${totalResultados})` },
              { id: 'multas', label: `Multas (${multasEncontradas.length})` },
              { id: 'condutores', label: `Condutores (${condutoresEncontrados.length})` },
              { id: 'viaturas', label: `Viaturas (${viaturasEncontradas.length})` },
              { id: 'pagamentos', label: `Pagamentos (${pagamentosEncontrados.length})` },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaAtiva(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                categoriaAtiva === c.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      {termoLimpo ? (
        <div className="space-y-6">
          {/* Section: Multas */}
          {(categoriaAtiva === 'tudo' || categoriaAtiva === 'multas') && multasEncontradas.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Autos de Multa Encontrados ({multasEncontradas.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {multasEncontradas.map((m) => (
                  <div
                    key={m.id || m.numeroMulta}
                    onClick={() => onOpenAutoNoticia(m)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40 transition-all cursor-pointer flex justify-between items-start"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                          {m.numeroMulta}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(m.statusPagamento)}`}>
                          {m.statusPagamento}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {m.nomeCondutor || m.bi}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Matrícula: <strong className="font-mono text-slate-700 dark:text-slate-200">{m.matricula}</strong> • {m.tipoInfracao}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Data: {formatarData(m.dataMulta)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {formatarKz(m.valorTotal)}
                      </p>
                      <p className="text-[10px] text-slate-400">{m.ucf} UCF</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Condutores */}
          {(categoriaAtiva === 'tudo' || categoriaAtiva === 'condutores') && condutoresEncontrados.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Condutores Encontrados ({condutoresEncontrados.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {condutoresEncontrados.map((c) => (
                  <div
                    key={c.id || c.bi}
                    onClick={() => onOpenCondutor(c)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/40 transition-all cursor-pointer flex justify-between items-start"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.nome}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        BI: {c.bi} • Carta: {c.numeroCarta || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tel: {c.telefone}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                      Ver Ficha
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Viaturas */}
          {(categoriaAtiva === 'tudo' || categoriaAtiva === 'viaturas') && viaturasEncontradas.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-600" />
                Viaturas Encontradas ({viaturasEncontradas.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {viaturasEncontradas.map((v) => (
                  <div
                    key={v.id || v.matricula}
                    onClick={() => onOpenViatura(v)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-800/40 transition-all cursor-pointer flex justify-between items-start"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-amber-400 dark:bg-slate-800">
                        {v.matricula}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                        {v.marca} {v.modelo} ({v.cor})
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Proprietário: {v.proprietarioNome || 'Não registado'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {v.categoria}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Pagamentos */}
          {(categoriaAtiva === 'tudo' || categoriaAtiva === 'pagamentos') && pagamentosEncontrados.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Pagamentos e Transações ({pagamentosEncontrados.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pagamentosEncontrados.map((p) => {
                  const m = multas.find((item) => item.id === p.multaId || item.numeroMulta === p.numeroMulta);
                  return (
                    <div
                      key={p.id || p.referencia}
                      onClick={() => onOpenRecibo(p, m)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 transition-all cursor-pointer flex justify-between items-start"
                    >
                      <div>
                        <p className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                          Multa: {p.numeroMulta}
                        </p>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          Ref: {p.referencia}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatarData(p.dataPagamento)} • {p.metodoPagamento}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatarKz(p.valorPago)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {totalResultados === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Nenhum resultado encontrado para &quot;{termo}&quot;.
              </p>
              <p className="text-xs mt-1">
                Verifique se digitou o BI, matrícula ou número do auto correctamente.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center text-slate-500 space-y-2">
          <Search className="w-8 h-8 mx-auto text-amber-500/60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Digite um termo para pesquisar em toda a base de dados
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            A pesquisa unificada analisa condutores, viaturas, multas ativas, pagamentos e notas fiscais simultaneamente.
          </p>
        </div>
      )}
    </div>
  );
};
