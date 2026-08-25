import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginModal';
import { Dashboard } from './pages/Dashboard';
import { Condutores } from './pages/Condutores';
import { Viaturas } from './pages/Viaturas';
import { Multas } from './pages/Multas';
import { Pagamentos } from './pages/Pagamentos';
import { PesquisaGlobal } from './pages/PesquisaGlobal';
import { Relatorios } from './pages/Relatorios';
import { Auditoria } from './pages/Auditoria';
import { UtilizadoresPage } from './pages/Utilizadores';
import { AssistenteIA } from './pages/AssistenteIA';
import { Configuracoes } from './pages/Configuracoes';
import { AutoNoticiaModal } from './components/AutoNoticiaModal';
import { ReciboPagamentoModal } from './components/ReciboPagamentoModal';
import {
  Condutor,
  Viatura,
  Multa,
  Pagamento,
  LogAuditoria,
  Utilizador,
} from './types';
import {
  subscribeCondutores,
  subscribeViaturas,
  subscribeMultas,
  subscribePagamentos,
  subscribeLogsAuditoria,
  subscribeUtilizadores,
  semearDadosIniciaisSeVazio,
} from './services/firestoreService';
import { Shield } from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, loading } = useAuth();

  const [paginaAtiva, setPaginaAtiva] = useState('dashboard');
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Firestore Real-Time States
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [multas, setMultas] = useState<Multa[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);

  // Modais
  const [multaParaAuto, setMultaParaAuto] = useState<Multa | null>(null);
  const [reciboModalData, setReciboModalData] = useState<{
    pagamento: Pagamento;
    multa?: Multa;
  } | null>(null);

  const [multaParaPagamento, setMultaParaPagamento] = useState<Multa | null>(null);

  // Efeito Modo Escuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Efeito Ouvintes do Firestore
  useEffect(() => {
    if (!currentUser && !userProfile) return;

    if (userProfile) {
      semearDadosIniciaisSeVazio(userProfile);
    }

    const unsubCond = subscribeCondutores(setCondutores);
    const unsubViat = subscribeViaturas(setViaturas);
    const unsubMult = subscribeMultas(setMultas);
    const unsubPag = subscribePagamentos(setPagamentos);
    const unsubLogs = subscribeLogsAuditoria(setLogs);
    const unsubUsers = subscribeUtilizadores(setUtilizadores);

    return () => {
      unsubCond();
      unsubViat();
      unsubMult();
      unsubPag();
      unsubLogs();
      unsubUsers();
    };
  }, [currentUser, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold animate-spin shadow-lg shadow-amber-500/20">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-400">
          A inicializar Sistema de Gestão de Multas de Trânsito...
        </p>
      </div>
    );
  }

  if (!currentUser && !userProfile) {
    return <LoginScreen />;
  }

  // Ações de navegação cruzada
  const handleOpenAutoNoticia = (multa: Multa) => {
    setMultaParaAuto(multa);
  };

  const handleOpenRecibo = (pagamento: Pagamento, multa?: Multa) => {
    setReciboModalData({ pagamento, multa });
  };

  const handleOpenPagamentoParaMulta = (multa: Multa) => {
    setMultaParaPagamento(multa);
    setPaginaAtiva('pagamentos');
  };

  const handleAbrirCondutorNaLista = (condutor: Condutor) => {
    setPaginaAtiva('condutores');
  };

  const handleAbrirViaturaNaLista = (viatura: Viatura) => {
    setPaginaAtiva('viaturas');
  };

  const titulosPaginas: Record<string, string> = {
    dashboard: 'Painel Principal & Indicadores',
    multas: 'Gestão de Multas & Infrações',
    pagamentos: 'Pagamentos, Caixa & Recibos',
    condutores: 'Registo e Cadastro de Condutores',
    viaturas: 'Parque de Viaturas e Matrículas',
    pesquisa: 'Pesquisa Global do Sistema',
    relatorios: 'Relatórios e Mapas Estatísticos',
    'assistente-ia': 'Assistente Inteligente (Gemini IA)',
    utilizadores: 'Gestão de Utilizadores & Permissões',
    auditoria: 'Registo e Logs de Auditoria',
    configuracoes: 'Base de Dados & Conexão MySQL',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={paginaAtiva}
        setActiveTab={setPaginaAtiva}
        isOpen={sidebarAberta}
        setIsOpen={setSidebarAberta}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar */}
        <Navbar
          pageTitle={titulosPaginas[paginaAtiva] || 'Sistema de Gestão de Multas'}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenMobileSidebar={() => setSidebarAberta(true)}
          multas={multas}
          onOpenMultaDetalhes={handleOpenAutoNoticia}
          onNavigate={setPaginaAtiva}
        />

        {/* Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {paginaAtiva === 'dashboard' && (
            <Dashboard
              multas={multas}
              condutores={condutores}
              viaturas={viaturas}
              pagamentos={pagamentos}
              onNavigate={setPaginaAtiva}
              onOpenAutoNoticia={handleOpenAutoNoticia}
              onOpenPagamento={handleOpenPagamentoParaMulta}
            />
          )}

          {paginaAtiva === 'multas' && (
            <Multas
              multas={multas}
              condutores={condutores}
              viaturas={viaturas}
              onOpenAutoNoticia={handleOpenAutoNoticia}
              onOpenPagamentoParaMulta={handleOpenPagamentoParaMulta}
            />
          )}

          {paginaAtiva === 'condutores' && (
            <Condutores
              condutores={condutores}
              multas={multas}
              onOpenMultaDetalhes={handleOpenAutoNoticia}
            />
          )}

          {paginaAtiva === 'viaturas' && (
            <Viaturas
              viaturas={viaturas}
              condutores={condutores}
              multas={multas}
              onOpenMultaDetalhes={handleOpenAutoNoticia}
            />
          )}

          {paginaAtiva === 'pagamentos' && (
            <Pagamentos
              pagamentos={pagamentos}
              multas={multas}
              onOpenReciboModal={handleOpenRecibo}
              multaPreSelecionada={multaParaPagamento}
              onLimparMultaPreSelecionada={() => setMultaParaPagamento(null)}
            />
          )}

          {paginaAtiva === 'pesquisa' && (
            <PesquisaGlobal
              multas={multas}
              condutores={condutores}
              viaturas={viaturas}
              pagamentos={pagamentos}
              onOpenAutoNoticia={handleOpenAutoNoticia}
              onOpenRecibo={handleOpenRecibo}
              onOpenCondutor={handleAbrirCondutorNaLista}
              onOpenViatura={handleAbrirViaturaNaLista}
            />
          )}

          {paginaAtiva === 'relatorios' && (
            <Relatorios multas={multas} pagamentos={pagamentos} />
          )}

          {paginaAtiva === 'auditoria' && (
            <Auditoria logs={logs} />
          )}

          {paginaAtiva === 'utilizadores' && (
            <UtilizadoresPage utilizadores={utilizadores} />
          )}

          {paginaAtiva === 'assistente-ia' && (
            <AssistenteIA
              multas={multas}
              condutores={condutores}
              viaturas={viaturas}
              pagamentos={pagamentos}
            />
          )}

          {paginaAtiva === 'configuracoes' && (
            <Configuracoes />
          )}
        </main>
      </div>

      {/* Auto de Notícia Modal */}
      {multaParaAuto && (
        <AutoNoticiaModal
          multa={multaParaAuto}
          isOpen={!!multaParaAuto}
          onClose={() => setMultaParaAuto(null)}
        />
      )}

      {/* Recibo de Pagamento Modal */}
      {reciboModalData && (
        <ReciboPagamentoModal
          pagamento={reciboModalData.pagamento}
          multa={reciboModalData.multa}
          isOpen={!!reciboModalData}
          onClose={() => setReciboModalData(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
