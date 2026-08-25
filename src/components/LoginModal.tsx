import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Eye, 
  UserPlus, 
  LogIn, 
  IdCard,
  Chrome
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PerfilUtilizador } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, loginWithGoogle, register, quickLoginAs, loading } = useAuth();
  
  const [modoAba, setModoAba] = useState<'entrar' | 'registar'>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [bi, setBi] = useState('');
  const [perfil, setPerfil] = useState<PerfilUtilizador>('Administrador');
  
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!email || !senha) {
      setErro('Por favor, preencha o e-mail e a palavra-passe.');
      return;
    }

    if (modoAba === 'registar') {
      if (!nome) {
        setErro('Por favor, informe o seu nome completo.');
        return;
      }
      if (senha.length < 6) {
        setErro('A palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setProcessando(true);
    try {
      if (modoAba === 'entrar') {
        await login(email, senha);
      } else {
        await register(email, senha, nome, bi || '000000000LA001', perfil);
        setSucesso('Conta criada e autenticada com sucesso no Firebase!');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar autenticação no Firebase.');
    } finally {
      setProcessando(false);
    }
  };

  const handleLoginGoogle = async () => {
    setProcessando(true);
    setErro(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErro(err.message || 'Erro ao autenticar com a conta Google.');
    } finally {
      setProcessando(false);
    }
  };

  const handleAcessoRapido = async (p: PerfilUtilizador) => {
    setProcessando(true);
    setErro(null);
    try {
      await quickLoginAs(p);
    } catch (err: any) {
      setErro('Erro ao iniciar sessão rápida: ' + err.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5">
        {/* Emblem & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Sistema de Gestão de Multas de Trânsito
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            República de Angola • Direcção de Trânsito e Segurança Rodoviária
          </p>
        </div>

        {/* Tab Switcher: Entrar vs Criar Conta */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setModoAba('entrar');
              setErro(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modoAba === 'entrar'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setModoAba('registar');
              setErro(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              modoAba === 'registar'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Criar Nova Conta
          </button>
        </div>

        {erro && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Aviso de Acesso</p>
              <p className="leading-relaxed">{erro}</p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={processando || loading}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Chrome className="w-4 h-4 text-amber-400" />
          Continuar com a Conta Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-[10px] uppercase font-bold text-slate-500">ou com email e senha</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {modoAba === 'registar' && (
            <>
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-nome-input"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Avelino Jonasse"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Bilhete de Identidade (BI)
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-bi-input"
                    type="text"
                    value={bi}
                    onChange={(e) => setBi(e.target.value.toUpperCase())}
                    placeholder="Ex: 004819283LA034"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono uppercase placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  id="register-perfil-select"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as PerfilUtilizador)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold focus:outline-hidden focus:border-amber-500"
                >
                  <option value="Administrador">Administrador (Acesso Total)</option>
                  <option value="Agente">Agente de Trânsito (Registo e Consulta)</option>
                  <option value="Consulta">Consulta (Apenas Leitura)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Email Institucional ou Pessoal *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Palavra-passe / Senha (Mín. 6 caracteres) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-senha-input"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={processando || loading}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {processando 
              ? 'A comunicar com Firebase...' 
              : modoAba === 'entrar' 
                ? 'Entrar no Sistema' 
                : 'Registar Conta no Firebase'}
          </button>
        </form>

        {/* Demo Fast Access Profiles */}
        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Acessos Rápidos de Demonstração (Sem Senha)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              id="demo-admin-btn"
              type="button"
              onClick={() => handleAcessoRapido('Administrador')}
              disabled={processando}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-amber-500/30 text-center transition-all cursor-pointer group"
            >
              <Shield className="w-4 h-4 mx-auto text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-white mt-1">Admin</span>
              <span className="block text-[9px] text-amber-400 font-medium">Acesso Total</span>
            </button>

            <button
              id="demo-agente-btn"
              type="button"
              onClick={() => handleAcessoRapido('Agente')}
              disabled={processando}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-blue-500/30 text-center transition-all cursor-pointer group"
            >
              <User className="w-4 h-4 mx-auto text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-white mt-1">Agente</span>
              <span className="block text-[9px] text-blue-400 font-medium">Autos & Frotas</span>
            </button>

            <button
              id="demo-consulta-btn"
              type="button"
              onClick={() => handleAcessoRapido('Consulta')}
              disabled={processando}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-center transition-all cursor-pointer group"
            >
              <Eye className="w-4 h-4 mx-auto text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="block text-[11px] font-bold text-white mt-1">Consulta</span>
              <span className="block text-[9px] text-slate-400 font-medium">Somente Leitura</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Protegido com Firebase Auth & Cloud Firestore
        </div>
      </div>
    </div>
  );
};
