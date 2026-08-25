import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Car,
  FileText,
  User,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Multa, Condutor, Viatura, Pagamento } from '../types';

interface AssistenteIAProps {
  multas: Multa[];
  condutores: Condutor[];
  viaturas: Viatura[];
  pagamentos: Pagamento[];
}

interface MensagemChat {
  id: string;
  remetente: 'user' | 'ai';
  texto: string;
  data: Date;
}

const PERGUNTAS_SUGERIDAS = [
  'Qual é o valor da multa por excesso de velocidade em Angola?',
  'Qual é o prazo legal para o condutor pagar uma coima sem juros?',
  'Quais as consequências de conduzir com a carta de condução caducada?',
  'Faça uma análise estatística dos autos de multa registrados no sistema.',
  'Qual a diferença entre infrações Leves, Graves e Muito Graves no Código de Estrada?',
  'Como o condutor pode contestar ou interpor recurso administrativo de uma multa?',
];

export const AssistenteIA: React.FC<AssistenteIAProps> = ({
  multas,
  condutores,
  viaturas,
  pagamentos,
}) => {
  const { userProfile } = useAuth();

  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: '1',
      remetente: 'ai',
      texto: `Olá, ${userProfile?.nome || 'Operador'}! Sou o **Assistente de Inteligência Artificial do Sistema de Gestão de Multas de Trânsito de Angola**.

Estou preparado para esclarecer dúvidas sobre o **Código de Estrada da República de Angola**, cálculo de **UCF (Unidades de Correção Fiscal)**, normas da DTSER / Polícia Nacional e fornecer análises e relatórios inteligentes sobre os dados do sistema.

Como posso ajudá-lo hoje?`,
      data: new Date(),
    },
  ]);

  const [inputTexto, setInputTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, carregando]);

  // Contexto estatístico dos dados locais
  const obterResumoContexto = () => {
    const totalMultas = multas.length;
    const pagas = multas.filter((m) => m.statusPagamento === 'Pago').length;
    const pendentes = multas.filter((m) => m.statusPagamento === 'Pendente' || m.statusPagamento === 'Parcialmente Pago').length;
    const totalKz = multas.reduce((acc, m) => acc + (m.valorTotal || 0), 0);
    const arrecadadoKz = pagamentos.reduce((acc, p) => acc + (p.valorPago || 0), 0);

    return `Total de multas registadas: ${totalMultas}, Pagas: ${pagas}, Pendentes: ${pendentes}, Volume Total de Coimas: ${totalKz} Kz, Total Arrecadado: ${arrecadadoKz} Kz, Total Condutores: ${condutores.length}, Total Viaturas: ${viaturas.length}.`;
  };

  const enviarMensagem = async (perguntaTexto?: string) => {
    const textoParaEnviar = perguntaTexto || inputTexto;
    if (!textoParaEnviar.trim() || carregando) return;

    const novaMsgUsuario: MensagemChat = {
      id: Date.now().toString(),
      remetente: 'user',
      texto: textoParaEnviar,
      data: new Date(),
    };

    setMensagens((prev) => [...prev, novaMsgUsuario]);
    if (!perguntaTexto) setInputTexto('');
    setCarregando(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textoParaEnviar,
          userRole: userProfile?.perfil || 'Consulta',
          systemContext: obterResumoContexto(),
        }),
      });

      const data = await response.json();
      const respostaIA: MensagemChat = {
        id: (Date.now() + 1).toString(),
        remetente: 'ai',
        texto: data.reply || data.answer || data.error || 'Desculpe, não consegui processar a resposta no momento.',
        data: new Date(),
      };

      setMensagens((prev) => [...prev, respostaIA]);
    } catch (err: any) {
      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          remetente: 'ai',
          texto: 'Erro na ligação ao serviço de Inteligência Artificial Gemini. Por favor, tente novamente.',
          data: new Date(),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div id="assistente-ia-container" className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Assistente IA Rodoviário de Angola
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                Gemini 2.5
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Especialista em Legislação de Trânsito, Código de Estrada e Análise de Dados
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMensagens([
              {
                id: Date.now().toString(),
                remetente: 'ai',
                texto: 'Conversa reiniciada. Como posso ajudar nas suas consultas jurídicas ou operacionais?',
                data: new Date(),
              },
            ]);
          }}
          title="Reiniciar Conversa"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs"
      >
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.remetente === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.remetente === 'user'
                  ? 'bg-slate-900 text-amber-400 dark:bg-slate-800'
                  : 'bg-amber-500 text-slate-950 shadow-xs'
              }`}
            >
              {msg.remetente === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                msg.remetente === 'user'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.texto}</div>
              <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-2 text-right">
                {msg.data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              A analisar Código de Estrada e a consultar a base de dados...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Sugestões:
        </span>
        {PERGUNTAS_SUGERIDAS.map((pergunta, idx) => (
          <button
            key={idx}
            onClick={() => enviarMensagem(pergunta)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {pergunta}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviarMensagem();
        }}
        className="relative shrink-0"
      >
        <input
          id="input-assistente-ia"
          type="text"
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          placeholder="Escreva a sua dúvida sobre o Código de Estrada, cálculo de multas ou dados estatísticos..."
          className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
        />
        <button
          type="submit"
          id="btn-enviar-ia"
          disabled={!inputTexto.trim() || carregando}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
