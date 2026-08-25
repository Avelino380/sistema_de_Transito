import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { Condutor, Multa } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { criarCondutor, atualizarCondutor, eliminarCondutor } from '../services/firestoreService';
import { formatarData, formatarKz, getStatusBadgeClass, validarBIAngolano } from '../utils/formatters';
import { ConfirmModal } from '../components/ConfirmModal';

interface CondutoresProps {
  condutores: Condutor[];
  multas: Multa[];
  onOpenMultaDetalhes: (multa: Multa) => void;
}

export const Condutores: React.FC<CondutoresProps> = ({
  condutores,
  multas,
  onOpenMultaDetalhes,
}) => {
  const { userProfile, canEdit, isAdmin } = useAuth();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [condutorEditando, setCondutorEditando] = useState<Condutor | null>(null);
  const [condutorDetalhes, setCondutorDetalhes] = useState<Condutor | null>(null);
  const [condutorEliminar, setCondutorEliminar] = useState<Condutor | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    bi: '',
    numeroCarta: '',
    endereco: '',
    telefone: '',
    email: '',
    dataNascimento: '',
    ativo: true,
  });

  const abrirModalCadastro = () => {
    setCondutorEditando(null);
    setFormData({
      nome: '',
      bi: '',
      numeroCarta: '',
      endereco: '',
      telefone: '+244 ',
      email: '',
      dataNascimento: '1990-01-01',
      ativo: true,
    });
    setErro(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (c: Condutor) => {
    setCondutorEditando(c);
    setFormData({
      nome: c.nome,
      bi: c.bi,
      numeroCarta: c.numeroCarta,
      endereco: c.endereco,
      telefone: c.telefone,
      email: c.email,
      dataNascimento: c.dataNascimento,
      ativo: c.ativo,
    });
    setErro(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!formData.nome.trim()) {
      setErro('O nome completo do condutor é obrigatório.');
      return;
    }
    if (!formData.bi.trim()) {
      setErro('O Número de Bilhete de Identidade (BI) é obrigatório.');
      return;
    }
    if (!validarBIAngolano(formData.bi)) {
      setErro('O formato do BI é inválido. Digite um BI angolano válido (ex: 000000000LA000).');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      if (condutorEditando && condutorEditando.id) {
        await atualizarCondutor(condutorEditando.id, formData, userProfile);
      } else {
        await criarCondutor(formData, userProfile);
      }
      setModalAberto(false);
    } catch (err: any) {
      setErro(err.message || 'Erro ao guardar dados do condutor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!condutorEliminar || !condutorEliminar.id || !userProfile) return;
    try {
      await eliminarCondutor(condutorEliminar.id, condutorEliminar.nome, userProfile);
      setCondutorEliminar(null);
      if (condutorDetalhes?.id === condutorEliminar.id) {
        setCondutorDetalhes(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pesquisa avançada: BI, nome, número da carta, telefone
  const condutoresFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return condutores;
    return condutores.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.bi.toLowerCase().includes(q) ||
        c.numeroCarta.toLowerCase().includes(q) ||
        c.telefone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [condutores, busca]);

  // Multas do condutor selecionado em detalhes
  const multasDoCondutor = useMemo(() => {
    if (!condutorDetalhes) return [];
    return multas.filter(
      (m) =>
        (condutorDetalhes.bi && m.bi === condutorDetalhes.bi) ||
        (condutorDetalhes.numeroCarta && m.numeroCarta === condutorDetalhes.numeroCarta)
    );
  }, [multas, condutorDetalhes]);

  return (
    <div id="condutores-container" className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Gestão de Condutores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registo, consulta e histórico de condutores e cartas de condução
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-condutor-input"
              type="text"
              placeholder="Pesquisar por BI, Nome, Carta, Telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-64 sm:w-80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {canEdit && (
            <button
              id="novo-condutor-btn"
              onClick={abrirModalCadastro}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Condutor
            </button>
          )}
        </div>
      </div>

      {/* Condutores Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nome Completo</th>
                <th className="py-3.5 px-4">Nº BI</th>
                <th className="py-3.5 px-4">Carta Condução</th>
                <th className="py-3.5 px-4">Telefone</th>
                <th className="py-3.5 px-4">Registo</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {condutoresFiltrados.length > 0 ? (
                condutoresFiltrados.map((c) => {
                  const multasDeste = multas.filter((m) => m.bi === c.bi).length;
                  return (
                    <tr
                      key={c.id || c.bi}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {c.nome}
                        {multasDeste > 0 && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-bold">
                            {multasDeste} {multasDeste === 1 ? 'multa' : 'multas'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{c.bi}</td>
                      <td className="py-3 px-4 font-mono">{c.numeroCarta || '-'}</td>
                      <td className="py-3 px-4">{c.telefone}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {formatarData(c.dataRegisto)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            c.ativo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            id={`detalhes-condutor-${c.bi}`}
                            onClick={() => setCondutorDetalhes(c)}
                            title="Ver Detalhes e Histórico"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              id={`editar-condutor-${c.bi}`}
                              onClick={() => abrirModalEdicao(c)}
                              title="Editar Condutor"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              id={`eliminar-condutor-${c.bi}`}
                              onClick={() => setCondutorEliminar(c)}
                              title="Eliminar Condutor"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum condutor encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes & Histórico de Multas */}
      {condutorDetalhes && (
        <div
          id="detalhes-condutor-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="detalhes-condutor-modal"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ficha do Condutor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dados de identificação e cadastro nacional
                  </p>
                </div>
              </div>
              <button
                id="close-detalhes-condutor"
                onClick={() => setCondutorDetalhes(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong className="text-slate-500 dark:text-slate-400">Nome:</strong> <span className="font-bold text-slate-900 dark:text-white">{condutorDetalhes.nome}</span></p>
                <p><strong className="text-slate-500 dark:text-slate-400">BI:</strong> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{condutorDetalhes.bi}</span></p>
                <p><strong className="text-slate-500 dark:text-slate-400">Carta de Condução:</strong> {condutorDetalhes.numeroCarta || '-'}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Data de Nascimento:</strong> {formatarData(condutorDetalhes.dataNascimento)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong className="text-slate-500 dark:text-slate-400">Telefone:</strong> {condutorDetalhes.telefone}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">E-mail:</strong> {condutorDetalhes.email || '-'}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Endereço:</strong> {condutorDetalhes.endereco || '-'}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Data Registo:</strong> {formatarData(condutorDetalhes.dataRegisto)}</p>
              </div>
            </div>

            {/* Histórico de Multas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Histórico de Infrações e Multas ({multasDoCondutor.length})</span>
              </h4>

              {multasDoCondutor.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {multasDoCondutor.map((m) => (
                    <div
                      key={m.id || m.numeroMulta}
                      onClick={() => {
                        onOpenMultaDetalhes(m);
                        setCondutorDetalhes(null);
                      }}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-amber-400 transition-colors cursor-pointer"
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
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                          {m.tipoInfracao} • <span className="font-mono">{m.matricula}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Data: {formatarData(m.dataMulta)} • Agente: {m.agenteNome}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatarKz(m.valorTotal)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {m.ucf} UCF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center text-xs text-emerald-700 dark:text-emerald-300">
                  Condutor sem histórico de infrações registradas no sistema.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {modalAberto && (
        <div
          id="modal-condutor-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="modal-condutor"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                {condutorEditando ? 'Editar Condutor' : 'Registar Novo Condutor'}
              </h3>
              <button
                id="close-modal-condutor"
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {erro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    id="condutor-form-nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: João Baptista da Silva"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nº Bilhete de Identidade (BI) *
                  </label>
                  <input
                    id="condutor-form-bi"
                    type="text"
                    required
                    value={formData.bi}
                    onChange={(e) => setFormData({ ...formData, bi: e.target.value.toUpperCase() })}
                    placeholder="Ex: 004819283LA034"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nº Carta de Condução
                  </label>
                  <input
                    id="condutor-form-carta"
                    type="text"
                    value={formData.numeroCarta}
                    onChange={(e) => setFormData({ ...formData, numeroCarta: e.target.value.toUpperCase() })}
                    placeholder="Ex: C-0829103/LA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    id="condutor-form-telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="+244 923 000 000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    id="condutor-form-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@dominio.ao"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    id="condutor-form-nascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado do Registo
                  </label>
                  <select
                    id="condutor-form-ativo"
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Endereço Residencial
                  </label>
                  <input
                    id="condutor-form-endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Ex: Bairro Maianga, Rua Rainha Ginga, Luanda"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-condutor-form-btn"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="salvar-condutor-form-btn"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'A guardar...' : condutorEditando ? 'Atualizar Dados' : 'Registar Condutor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!condutorEliminar}
        title="Eliminar Condutor"
        message={`Tem certeza que deseja remover o registo de ${condutorEliminar?.nome}? Esta acção será registada na auditoria.`}
        confirmLabel="Sim, Eliminar"
        isDestructive
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setCondutorEliminar(null)}
      />
    </div>
  );
};
