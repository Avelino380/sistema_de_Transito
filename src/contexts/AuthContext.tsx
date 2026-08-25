import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Utilizador, PerfilUtilizador } from '../types';
import { registrarLogAuditoria } from '../services/auditService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: Utilizador | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, nome: string, bi: string, perfil: PerfilUtilizador) => Promise<void>;
  logout: () => Promise<void>;
  quickLoginAs: (perfil: PerfilUtilizador) => Promise<void>;
  canEdit: boolean;
  isAdmin: boolean;
  isAgente: boolean;
  isConsulta: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Utilizador | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'utilizadores', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as Utilizador;
            setUserProfile(data);
            // Atualizar último acesso
            await updateDoc(userDocRef, {
              ultimoAcesso: new Date().toISOString(),
            }).catch(() => {});
          } else {
            // Se for novo ou Google Login ou anónimo, criar perfil padrão
            const perfilPadrao: PerfilUtilizador = 
              (user.email?.includes('agente') && !user.email?.includes('admin')) 
                ? 'Agente' 
                : 'Administrador'; // Concede Administrador para acesso completo inicial

            const novoPerfil: Utilizador = {
              uid: user.uid,
              nome: user.displayName || (user.email ? user.email.split('@')[0] : 'Operador do Sistema'),
              email: user.email || 'operador@transito.gov.ao',
              bi: '000000000LA001',
              perfil: perfilPadrao,
              ativo: true,
              dataCriacao: new Date().toISOString(),
              ultimoAcesso: new Date().toISOString(),
            };

            await setDoc(userDocRef, novoPerfil);
            setUserProfile(novoPerfil);
          }
        } catch (error) {
          console.error('Erro ao sincronizar perfil do utilizador:', error);
          // Fallback seguro em memória caso o Firestore tenha alguma latência
          setUserProfile({
            uid: user.uid,
            nome: user.displayName || user.email || 'Administrador',
            email: user.email || 'operador@transito.gov.ao',
            bi: '',
            perfil: 'Administrador',
            ativo: true,
            dataCriacao: new Date().toISOString(),
            ultimoAcesso: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim();
    try {
      let credUser: User | null = null;
      let novoUtilizadorCriado = false;

      try {
        // Tentar autenticar com conta existente
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        credUser = cred.user;
      } catch (loginErr: any) {
        // Se a conta ainda não existir no Firebase Auth, criar automaticamente no primeiro acesso
        if (
          loginErr.code === 'auth/user-not-found' ||
          loginErr.code === 'auth/invalid-credential'
        ) {
          try {
            const novoCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            credUser = novoCred.user;
            novoUtilizadorCriado = true;
          } catch (createErr: any) {
            // Se falhar ao criar porque a senha era inválida ou email já existia com outra senha
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Palavra-passe incorreta para este email.');
            } else if (createErr.code === 'auth/weak-password') {
              throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
            }
            throw createErr;
          }
        } else {
          throw loginErr;
        }
      }

      if (credUser) {
        const perfilPadrao: PerfilUtilizador = 
          (cleanEmail.includes('agente') && !cleanEmail.includes('admin')) 
            ? 'Agente' 
            : 'Administrador';

        const userDocRef = doc(db, 'utilizadores', credUser.uid);
        const userDocSnap = await getDoc(userDocRef).catch(() => null);

        let perfilAtual: Utilizador;
        if (userDocSnap && userDocSnap.exists()) {
          perfilAtual = userDocSnap.data() as Utilizador;
        } else {
          perfilAtual = {
            uid: credUser.uid,
            nome: credUser.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            bi: '000000000LA001',
            perfil: perfilPadrao,
            ativo: true,
            dataCriacao: new Date().toISOString(),
            ultimoAcesso: new Date().toISOString(),
          };
          await setDoc(userDocRef, perfilAtual).catch(() => {});
        }

        setUserProfile(perfilAtual);

        await registrarLogAuditoria({
          utilizadorId: credUser.uid,
          utilizadorNome: perfilAtual.nome,
          utilizadorEmail: cleanEmail,
          acao: novoUtilizadorCriado ? 'Criação' : 'Login',
          recurso: 'sistema',
          documentoId: credUser.uid,
          detalhes: novoUtilizadorCriado 
            ? `Conta criada e sessão iniciada (${cleanEmail})` 
            : `Sessão iniciada via e-mail e palavra-passe (${cleanEmail})`,
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      if (err.code === 'auth/invalid-email') {
        throw new Error('O formato do email fornecido é inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('Acesso temporariamente bloqueado por excesso de tentativas. Tente novamente em instantes.');
      }
      throw new Error(err.message || 'Erro ao autenticar. Por favor tente novamente ou use o Acesso Rápido.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      
      const cleanEmail = cred.user.email || 'operador@transito.gov.ao';
      const userDocRef = doc(db, 'utilizadores', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef).catch(() => null);

      let perfilAtual: Utilizador;
      if (userDocSnap && userDocSnap.exists()) {
        perfilAtual = userDocSnap.data() as Utilizador;
      } else {
        perfilAtual = {
          uid: cred.user.uid,
          nome: cred.user.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          bi: '000000000LA001',
          perfil: 'Administrador',
          ativo: true,
          dataCriacao: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };
        await setDoc(userDocRef, perfilAtual).catch(() => {});
      }

      setUserProfile(perfilAtual);

      await registrarLogAuditoria({
        utilizadorId: cred.user.uid,
        utilizadorNome: perfilAtual.nome,
        utilizadorEmail: cleanEmail,
        acao: 'Login',
        recurso: 'sistema',
        documentoId: cred.user.uid,
        detalhes: `Sessão iniciada via Google Auth (${cleanEmail})`,
      }).catch(() => {});
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Usuário apenas fechou o popup
      } else if (err.code === 'auth/popup-blocked') {
        throw new Error('O navegador bloqueou a janela de autenticação. Por favor permita popups ou entre digitando o seu e-mail e senha.');
      } else {
        throw new Error(err.message || 'Erro ao autenticar com a conta Google. Tente entrar com email e senha ou Acesso Rápido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, nome: string, bi: string, perfil: PerfilUtilizador) => {
    setLoading(true);
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const novoPerfil: Utilizador = {
        uid: cred.user.uid,
        nome: nome.trim(),
        email: cleanEmail,
        bi: bi.trim(),
        perfil,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString(),
      };
      await setDoc(doc(db, 'utilizadores', cred.user.uid), novoPerfil).catch(() => {});
      setUserProfile(novoPerfil);

      await registrarLogAuditoria({
        utilizadorId: cred.user.uid,
        utilizadorNome: nome,
        utilizadorEmail: cleanEmail,
        acao: 'Criação',
        recurso: 'utilizadores',
        documentoId: cred.user.uid,
        detalhes: `Nova conta registada com perfil ${perfil}`,
      }).catch(() => {});
    } catch (err: any) {
      console.error('Erro no registo:', err);
      if (err.code === 'auth/email-already-in-use') {
        // Tentar fazer login diretamente com a senha
        try {
          await login(cleanEmail, pass);
          return;
        } catch {
          throw new Error('Este email já está registado. Se esta for a sua conta, utilize a aba "Entrar" com a sua palavra-passe.');
        }
      } else if (err.code === 'auth/weak-password') {
        throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('O formato do email fornecido é inválido.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (userProfile) {
      await registrarLogAuditoria({
        utilizadorId: userProfile.uid,
        utilizadorNome: userProfile.nome,
        utilizadorEmail: userProfile.email,
        acao: 'Consulta',
        recurso: 'sistema',
        documentoId: userProfile.uid,
        detalhes: 'Encerramento de sessão',
      }).catch(() => {});
    }
    await signOut(auth).catch(() => {});
    setUserProfile(null);
    setCurrentUser(null);
  };

  /**
   * Permite login rápido demonstrativo com qualquer um dos 3 perfis regulamentados
   */
  const quickLoginAs = async (perfil: PerfilUtilizador) => {
    setLoading(true);
    try {
      let email = 'admin@transito.gov.ao';
      let nome = 'Dr. Gaspar Manuel (Admin)';
      let bi = '003492819LA042';

      if (perfil === 'Agente') {
        email = 'agente.silva@transito.gov.ao';
        nome = 'Agente 1ª Classe Silva';
        bi = '004819283LA034';
      } else if (perfil === 'Consulta') {
        email = 'consulta.auditor@transito.gov.ao';
        nome = 'Auditor de Consulta Externa';
        bi = '001928374BE012';
      }

      let userId = 'demo-' + perfil.toLowerCase();

      // Tentar login anónimo ou por credencial no Firebase Auth
      try {
        if (!auth.currentUser) {
          const cred = await signInAnonymously(auth);
          userId = cred.user.uid;
        } else {
          userId = auth.currentUser.uid;
        }
      } catch (authErr) {
        console.warn('Fallback de autenticação anónima:', authErr);
      }

      const perfilData: Utilizador = {
        uid: userId,
        nome,
        email,
        bi,
        perfil,
        ativo: true,
        dataCriacao: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString(),
      };

      // Tenta gravar no Firestore
      try {
        await setDoc(doc(db, 'utilizadores', userId), perfilData);
      } catch (dbErr) {
        console.warn('Não foi possível gravar perfil no Firestore:', dbErr);
      }

      setUserProfile(perfilData);
    } catch (err: any) {
      console.error('Erro ao iniciar sessão demo:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const perfil = userProfile?.perfil || 'Administrador';
  const isAdmin = perfil === 'Administrador';
  const isAgente = perfil === 'Agente' || isAdmin;
  const isConsulta = perfil === 'Consulta';
  const canEdit = isAdmin || isAgente;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        quickLoginAs,
        canEdit,
        isAdmin,
        isAgente,
        isConsulta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
