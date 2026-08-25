import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Viatura, Condutor, Multa } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { criarViatura, atualizarViatura, eliminarViatura } from '../services/firestoreService';
import {
  formatarData,
  formatarKz,
  formatarMatricula,
  validarMatriculaAngola,
  getStatusBadgeClass,
} from '../utils/formatters';
import { ConfirmModal } from '../components/ConfirmModal';

interface ViaturasProps {
  viaturas: Viatura[];
  condutores: Condutor[];
  multas: Multa[];
  onOpenMultaDetalhes: (multa: Multa) => void;
}

export const Viaturas: React.FC<ViaturasProps> = ({
  viaturas,
  condutores,
  multas,
  onOpenMultaDetalhes,
}) => {
  const { userProfile, canEdit, isAdmin } = useAuth();

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [viaturaEditando, setViaturaEditando] = useState<Viatura | null>(null);
  const [viaturaDetalhes, setViaturaDetalhes] = useState<Viatura | null>(null);
  const [viaturaEliminar, setViaturaEliminar] = useState<Viatura | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    cor: '',
    categoria: 'Ligeiro de Passageiros',
    numeroChassi: '',
    proprietarioId: '',
    proprietarioNome: '',
    proprietarioBi: '',
    ativo: true,
  });

  const abrirModalCadastro = () => {
    setViaturaEditando(null);
    setFormData({
      matricula: 'LD-',
      marca: '',
      modelo: '',
      cor: '',
      categoria: 'Ligeiro de Passageiros',
      numeroChassi: '',
      proprietarioId: '',
      proprietarioNome: '',
      proprietarioBi: '',
      ativo: true,
    });
    setErro(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (v: Viatura) => {
    setViaturaEditando(v);
    setFormData({
      matricula: v.matricula,
      marca: v.marca,
      modelo: v.modelo,
      cor: v.cor,
      categoria: v.categoria || 'Ligeiro de Passageiros',
      numeroChassi: v.numeroChassi || '',
      proprietarioId: v.proprietarioId || '',
      proprietarioNome: v.proprietarioNome || '',
      proprietarioBi: v.proprietarioBi || '',
      ativo: v.ativo,
    });
    setErro(null);
    setModalAberto(true);
  };

  const handleSelecionarProprietario = (condutorId: string) => {
    const c = condutores.find((item) => item.id === condutorId);
    if (c) {
      setFormData({
        ...formData,
        proprietarioId: c.id || '',
        proprietarioNome: c.nome,
        proprietarioBi: c.bi,
      });
    } else {
      setFormData({
        ...formData,
        proprietarioId: '',
        proprietarioNome: '',
        proprietarioBi: '',
      });
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const matriculaFormatada = formatarMatricula(formData.matricula);

    if (!matriculaFormatada) {
      setErro('A matrícula da viatura é obrigatória.');
      return;
    }

    if (!validarMatriculaAngola(matriculaFormatada)) {
      setErro('Formato de matrícula angolana inválido. Exemplo: LD-12-34-AA ou HL-00-11-BB.');
      return;
    }

    if (!formData.marca.trim() || !formData.modelo.trim()) {
      setErro('A marca e o modelo da viatura são obrigatórios.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const dadosParaSalvar = {
        ...formData,
        matricula: matriculaFormatada,
      };

      if (viaturaEditando && viaturaEditando.id) {
        await atualizarViatura(viaturaEditando.id, dadosParaSalvar, userProfile);
      } else {
        await criarViatura(dadosParaSalvar, userProfile);
      }
      setModalAberto(false);
    } catch (err: any) {
      setErro(err.message || 'Erro ao guardar dados da viatura.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!viaturaEliminar || !viaturaEliminar.id || !userProfile) return;
    try {
      await eliminarViatura(viaturaEliminar.id, viaturaEliminar.matricula, userProfile);
      setViaturaEliminar(null);
      if (viaturaDetalhes?.id === viaturaEliminar.id) {
        setViaturaDetalhes(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtragem
  const viaturasFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return viaturas;
    return viaturas.filter(
      (v) =>
        v.matricula.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        (v.proprietarioNome && v.proprietarioNome.toLowerCase().includes(q)) ||
        (v.proprietarioBi && v.proprietarioBi.toLowerCase().includes(q)) ||
        v.numeroChassi.toLowerCase().includes(q)
    );
  }, [viaturas, busca]);

  // Multas da viatura selecionada
  const multasDaViatura = useMemo(() => {
    if (!viaturaDetalhes) return [];
    return multas.filter((m) => m.matricula === viaturaDetalhes.matricula);
  }, [multas, viaturaDetalhes]);

  return (
    <div id="viaturas-container" className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-500" />
            Gestão de Viaturas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastro de frota, validação de matrículas de Angola e proprietários
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-viatura-input"
              type="text"
              placeholder="Pesquisar matrícula (LD-..), marca, proprietário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-64 sm:w-80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {canEdit && (
            <button
              id="nova-viatura-btn"
              onClick={abrirModalCadastro}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registar Viatura
            </button>
          )}
        </div>
      </div>

      {/* Viaturas Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Matrícula</th>
                <th className="py-3.5 px-4">Marca & Modelo</th>
                <th className="py-3.5 px-4">Cor</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Proprietário</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {viaturasFiltradas.length > 0 ? (
                viaturasFiltradas.map((v) => {
                  const multasDesta = multas.filter((m) => m.matricula === v.matricula).length;
                  return (
                    <tr
                      key={v.id || v.matricula}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-slate-900 text-amber-400 dark:bg-slate-800 dark:border dark:border-slate-700">
                          {v.matricula}
                        </span>
                        {multasDesta > 0 && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 font-bold">
                            {multasDesta} multas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {v.marca} {v.modelo}
                      </td>
                      <td className="py-3 px-4">{v.cor || '-'}</td>
                      <td className="py-3 px-4">{v.categoria}</td>
                      <td className="py-3 px-4">
                        {v.proprietarioNome ? (
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{v.proprietarioNome}</p>
                            {v.proprietarioBi && (
                              <p className="text-[10px] font-mono text-slate-400">{v.proprietarioBi}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Não associado</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            v.ativo
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {v.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            id={`detalhes-viatura-${v.matricula}`}
                            onClick={() => setViaturaDetalhes(v)}
                            title="Ver Detalhes e Multas"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              id={`editar-viatura-${v.matricula}`}
                              onClick={() => abrirModalEdicao(v)}
                              title="Editar Viatura"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              id={`eliminar-viatura-${v.matricula}`}
                              onClick={() => setViaturaEliminar(v)}
                              title="Eliminar Viatura"
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
                    Nenhuma viatura cadastrada ou encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes da Viatura & Histórico */}
      {viaturaDetalhes && (
        <div
          id="detalhes-viatura-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="detalhes-viatura-modal"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ficha Técnica da Viatura
                  </h3>
                  <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    Matrícula: {viaturaDetalhes.matricula}
                  </p>
                </div>
              </div>
              <button
                id="close-detalhes-viatura"
                onClick={() => setViaturaDetalhes(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong className="text-slate-500 dark:text-slate-400">Marca / Modelo:</strong> <span className="font-bold text-slate-900 dark:text-white">{viaturaDetalhes.marca} {viaturaDetalhes.modelo}</span></p>
                <p><strong className="text-slate-500 dark:text-slate-400">Cor:</strong> {viaturaDetalhes.cor || '-'}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Categoria:</strong> {viaturaDetalhes.categoria}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Nº de Chassi:</strong> <span className="font-mono">{viaturaDetalhes.numeroChassi || '-'}</span></p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p><strong className="text-slate-500 dark:text-slate-400">Proprietário:</strong> <span className="font-bold text-slate-900 dark:text-white">{viaturaDetalhes.proprietarioNome || 'Não registado'}</span></p>
                <p><strong className="text-slate-500 dark:text-slate-400">BI do Proprietário:</strong> <span className="font-mono">{viaturaDetalhes.proprietarioBi || '-'}</span></p>
                <p><strong className="text-slate-500 dark:text-slate-400">Data de Registo:</strong> {formatarData(viaturaDetalhes.dataRegisto)}</p>
                <p><strong className="text-slate-500 dark:text-slate-400">Estado:</strong> {viaturaDetalhes.ativo ? 'Activa na Circulação' : 'Inactiva'}</p>
              </div>
            </div>

            {/* Multas da Viatura */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Histórico de Multas da Viatura ({multasDaViatura.length})
              </h4>

              {multasDaViatura.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {multasDaViatura.map((m) => (
                    <div
                      key={m.id || m.numeroMulta}
                      onClick={() => {
                        onOpenMultaDetalhes(m);
                        setViaturaDetalhes(null);
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
                          {m.tipoInfracao}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Data: {formatarData(m.dataMulta)} • Condutor autuado: {m.nomeCondutor || m.bi}
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
                  Nenhuma multa ou infração associada a esta matrícula.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {modalAberto && (
        <div
          id="modal-viatura-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            id="modal-viatura"
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6 overflow-hidden animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                {viaturaEditando ? 'Editar Viatura' : 'Registar Nova Viatura'}
              </h3>
              <button
                id="close-modal-viatura"
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
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Matrícula de Angola *
                  </label>
                  <input
                    id="viatura-form-matricula"
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                    placeholder="Ex: LD-12-34-AA ou BE-99-00-CC"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold uppercase text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Formato: LD-00-00-AA (Luanda, Benguela, Huíla, etc.)</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Veículo *
                  </label>
                  <select
                    id="viatura-form-categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="Ligeiro de Passageiros">Ligeiro de Passageiros</option>
                    <option value="Ligeiro de Mercadorias">Ligeiro de Mercadorias</option>
                    <option value="Pesado de Passageiros (Autocarro)">Pesado de Passageiros (Autocarro)</option>
                    <option value="Pesado de Mercadorias (Camião)">Pesado de Mercadorias (Camião)</option>
                    <option value="Motociclo / Ciclomotor">Motociclo / Ciclomotor</option>
                    <option value="Triciclo / Moto-táxi">Triciclo / Moto-táxi</option>
                    <option value="Trator / Máquina Agrícola">Trator / Máquina Agrícola</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marca *
                  </label>
                  <input
                    id="viatura-form-marca"
                    type="text"
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ex: Toyota, Hyundai, Nissan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo *
                  </label>
                  <input
                    id="viatura-form-modelo"
                    type="text"
                    required
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ex: Hilux, Fortuner, Corolla"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cor
                  </label>
                  <input
                    id="viatura-form-cor"
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="Ex: Branco, Preto, Cinzento"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nº de Chassi (VIN)
                  </label>
                  <input
                    id="viatura-form-chassi"
                    type="text"
                    value={formData.numeroChassi}
                    onChange={(e) => setFormData({ ...formData, numeroChassi: e.target.value.toUpperCase() })}
                    placeholder="Ex: AHTFR29G409182736"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular a Condutor / Proprietário Cadastrado
                  </label>
                  <select
                    id="viatura-form-proprietario"
                    value={formData.proprietarioId}
                    onChange={(e) => handleSelecionarProprietario(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="">-- Seleccionar Condutor Existente (Opcional) --</option>
                    {condutores.map((c) => (
                      <option key={c.id || c.bi} value={c.id}>
                        {c.nome} (BI: {c.bi})
                      </option>
                    ))}
                  </select>
                </div>

                {!formData.proprietarioId && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Proprietário (Manual)
                      </label>
                      <input
                        id="viatura-form-proprietario-nome"
                        type="text"
                        value={formData.proprietarioNome}
                        onChange={(e) => setFormData({ ...formData, proprietarioNome: e.target.value })}
                        placeholder="Nome do proprietário no livrete"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        BI do Proprietário
                      </label>
                      <input
                        id="viatura-form-proprietario-bi"
                        type="text"
                        value={formData.proprietarioBi}
                        onChange={(e) => setFormData({ ...formData, proprietarioBi: e.target.value.toUpperCase() })}
                        placeholder="Nº de BI do titular"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl uppercase font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  id="cancel-viatura-form-btn"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="salvar-viatura-form-btn"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'A guardar...' : viaturaEditando ? 'Atualizar Viatura' : 'Registar Viatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!viaturaEliminar}
        title="Eliminar Viatura"
        message={`Tem certeza que deseja remover o registo da viatura com matrícula ${viaturaEliminar?.matricula}?`}
        confirmLabel="Sim, Eliminar"
        isDestructive
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setViaturaEliminar(null)}
      />
    </div>
  );
};
