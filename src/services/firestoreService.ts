import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Condutor, Viatura, Multa, Pagamento, Utilizador, LogAuditoria } from '../types';
import { registrarLogAuditoria } from './auditService';
import { gerarNumeroMulta, gerarNumeroNotificacao } from '../utils/formatters';

// ==================== CONDUTORES ====================

export async function getCondutores(): Promise<Condutor[]> {
  const colRef = collection(db, 'condutores');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Condutor));
}

export function subscribeCondutores(callback: (condutores: Condutor[]) => void) {
  const colRef = collection(db, 'condutores');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Condutor)));
  });
}

export async function criarCondutor(
  condutor: Omit<Condutor, 'id' | 'dataRegisto'>,
  user: Utilizador
): Promise<string> {
  const colRef = collection(db, 'condutores');
  const novo = {
    ...condutor,
    dataRegisto: new Date().toISOString(),
    ativo: condutor.ativo !== undefined ? condutor.ativo : true,
  };
  const res = await addDoc(colRef, novo);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Criação',
    recurso: 'condutores',
    documentoId: res.id,
    detalhes: `Condutor registado: ${condutor.nome} (BI: ${condutor.bi})`,
  });
  return res.id;
}

export async function atualizarCondutor(
  id: string,
  dados: Partial<Condutor>,
  user: Utilizador
): Promise<void> {
  const docRef = doc(db, 'condutores', id);
  await updateDoc(docRef, dados);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Edição',
    recurso: 'condutores',
    documentoId: id,
    detalhes: `Condutor atualizado: ${dados.nome || id}`,
  });
}

export async function eliminarCondutor(id: string, nome: string, user: Utilizador): Promise<void> {
  const docRef = doc(db, 'condutores', id);
  await deleteDoc(docRef);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Exclusão',
    recurso: 'condutores',
    documentoId: id,
    detalhes: `Condutor excluído: ${nome}`,
  });
}

// ==================== VIATURAS ====================

export async function getViaturas(): Promise<Viatura[]> {
  const colRef = collection(db, 'viaturas');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Viatura));
}

export function subscribeViaturas(callback: (viaturas: Viatura[]) => void) {
  const colRef = collection(db, 'viaturas');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Viatura)));
  });
}

export async function criarViatura(
  viatura: Omit<Viatura, 'id' | 'dataRegisto'>,
  user: Utilizador
): Promise<string> {
  const colRef = collection(db, 'viaturas');
  const nova = {
    ...viatura,
    matricula: viatura.matricula.trim().toUpperCase(),
    dataRegisto: new Date().toISOString(),
    ativo: viatura.ativo !== undefined ? viatura.ativo : true,
  };
  const res = await addDoc(colRef, nova);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Criação',
    recurso: 'viaturas',
    documentoId: res.id,
    detalhes: `Viatura registada: ${nova.matricula} (${nova.marca} ${nova.modelo})`,
  });
  return res.id;
}

export async function atualizarViatura(
  id: string,
  dados: Partial<Viatura>,
  user: Utilizador
): Promise<void> {
  const docRef = doc(db, 'viaturas', id);
  await updateDoc(docRef, dados);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Edição',
    recurso: 'viaturas',
    documentoId: id,
    detalhes: `Viatura atualizada: ${dados.matricula || id}`,
  });
}

export async function eliminarViatura(id: string, matricula: string, user: Utilizador): Promise<void> {
  const docRef = doc(db, 'viaturas', id);
  await deleteDoc(docRef);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Exclusão',
    recurso: 'viaturas',
    documentoId: id,
    detalhes: `Viatura excluída: ${matricula}`,
  });
}

// ==================== MULTAS ====================

export async function getMultas(): Promise<Multa[]> {
  const colRef = collection(db, 'multas');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Multa));
}

export function subscribeMultas(callback: (multas: Multa[]) => void) {
  const colRef = collection(db, 'multas');
  const q = query(colRef, orderBy('dataRegisto', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Multa)));
  });
}

export async function verificarNumeroMultaExistente(numeroMulta: string): Promise<boolean> {
  const colRef = collection(db, 'multas');
  const q = query(colRef, where('numeroMulta', '==', numeroMulta), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function criarMulta(
  multa: Omit<Multa, 'id' | 'dataRegisto' | 'numeroMulta' | 'numeroNotificacao'> & {
    numeroMulta?: string;
    numeroNotificacao?: string;
  },
  user: Utilizador
): Promise<string> {
  let numeroMulta = multa.numeroMulta || gerarNumeroMulta();
  // Garantir unicidade absoluta
  let existe = await verificarNumeroMultaExistente(numeroMulta);
  while (existe) {
    numeroMulta = gerarNumeroMulta();
    existe = await verificarNumeroMultaExistente(numeroMulta);
  }

  const numeroNotificacao = multa.numeroNotificacao || gerarNumeroNotificacao();
  const valorTotal = multa.valorTotal || (multa.ucf * multa.valorUcfKz);

  const novaMulta: Omit<Multa, 'id'> = {
    ...multa,
    numeroMulta,
    numeroNotificacao,
    valorTotal,
    valorPago: multa.valorPago || 0,
    saldoDevedor: multa.statusPagamento === 'Pago' ? 0 : (valorTotal - (multa.valorPago || 0)),
    dataRegisto: new Date().toISOString(),
    statusPagamento: multa.statusPagamento || 'Pendente',
  };

  const colRef = collection(db, 'multas');
  const res = await addDoc(colRef, novaMulta);

  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Criação',
    recurso: 'multas',
    documentoId: res.id,
    detalhes: `Multa emitida: ${numeroMulta} para condutor BI: ${novaMulta.bi} - Matrícula: ${novaMulta.matricula} (Valor: ${valorTotal} Kz)`,
  });

  return res.id;
}

export async function atualizarMulta(
  id: string,
  dados: Partial<Multa>,
  user: Utilizador
): Promise<void> {
  const docRef = doc(db, 'multas', id);
  await updateDoc(docRef, dados);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Edição',
    recurso: 'multas',
    documentoId: id,
    detalhes: `Multa atualizada: ${dados.numeroMulta || id}`,
  });
}

export async function eliminarMulta(id: string, numeroMulta: string, user: Utilizador): Promise<void> {
  const docRef = doc(db, 'multas', id);
  await deleteDoc(docRef);
  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Exclusão',
    recurso: 'multas',
    documentoId: id,
    detalhes: `Multa excluída: ${numeroMulta}`,
  });
}

// ==================== PAGAMENTOS ====================

export async function getPagamentos(): Promise<Pagamento[]> {
  const colRef = collection(db, 'pagamentos');
  const q = query(colRef, orderBy('dataPagamento', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pagamento));
}

export function subscribePagamentos(callback: (pagamentos: Pagamento[]) => void) {
  const colRef = collection(db, 'pagamentos');
  const q = query(colRef, orderBy('dataPagamento', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pagamento)));
  });
}

export async function registrarPagamento(
  pagamento: Omit<Pagamento, 'id' | 'dataPagamento'>,
  user: Utilizador
): Promise<string> {
  const colRef = collection(db, 'pagamentos');
  const novoPagamento = {
    ...pagamento,
    dataPagamento: new Date().toISOString(),
  };
  const res = await addDoc(colRef, novoPagamento);

  // Atualizar a multa correspondente
  if (pagamento.multaId) {
    const multaRef = doc(db, 'multas', pagamento.multaId);
    const multaSnap = await getDoc(multaRef);

    if (multaSnap.exists()) {
      const multaData = multaSnap.data() as Multa;
      const totalJaPago = (multaData.valorPago || 0) + pagamento.valorPago;
      const valorTotal = multaData.valorTotal || 0;
      const saldoDevedor = Math.max(0, valorTotal - totalJaPago);

      let novoStatus: Multa['statusPagamento'] = 'Pendente';
      if (saldoDevedor <= 0) {
        novoStatus = 'Pago';
      } else if (totalJaPago > 0) {
        novoStatus = 'Parcialmente Pago';
      }

      await updateDoc(multaRef, {
        valorPago: totalJaPago,
        saldoDevedor,
        statusPagamento: novoStatus,
      });
    }
  }

  await registrarLogAuditoria({
    utilizadorId: user.uid,
    utilizadorNome: user.nome,
    utilizadorEmail: user.email,
    acao: 'Pagamento',
    recurso: 'pagamentos',
    documentoId: res.id,
    detalhes: `Pagamento registado: ${pagamento.valorPago} Kz para a multa ${pagamento.numeroMulta} via ${pagamento.metodoPagamento}`,
  });

  return res.id;
}

// ==================== UTILIZADORES ====================

export function subscribeUtilizadores(callback: (utilizadores: Utilizador[]) => void) {
  const colRef = collection(db, 'utilizadores');
  const q = query(colRef, orderBy('dataCriacao', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Utilizador)));
  });
}

export async function atualizarPerfilUtilizador(
  id: string,
  dados: Partial<Utilizador>,
  adminUser: Utilizador
): Promise<void> {
  const docRef = doc(db, 'utilizadores', id);
  await updateDoc(docRef, dados);
  await registrarLogAuditoria({
    utilizadorId: adminUser.uid,
    utilizadorNome: adminUser.nome,
    utilizadorEmail: adminUser.email,
    acao: 'Alteração de Permissões',
    recurso: 'utilizadores',
    documentoId: id,
    detalhes: `Perfil de utilizador atualizado: ${dados.perfil || 'dados modificados'}`,
  });
}

// ==================== LOGS AUDITORIA ====================

export function subscribeLogsAuditoria(callback: (logs: LogAuditoria[]) => void) {
  const colRef = collection(db, 'logsAuditoria');
  const q = query(colRef, orderBy('dataHora', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LogAuditoria)));
  });
}

// ==================== SEED INICIAL DE DADOS ====================

export async function semearDadosIniciaisSeVazio(adminUser: Utilizador): Promise<void> {
  try {
    const condutoresSnap = await getDocs(query(collection(db, 'condutores'), limit(1)));
    if (!condutoresSnap.empty) {
      return; // Já existem dados
    }

    console.log('Semeando dados iniciais do sistema...');

    // 1. Condutores de Exemplo
    const c1Id = await criarCondutor(
      {
        nome: 'António Domingos Silva',
        bi: '004819283LA034',
        numeroCarta: 'C-0829103/LA',
        endereco: 'Rua Rainha Ginga, Maianga, Luanda',
        telefone: '+244 923 456 789',
        email: 'antonio.silva@email.ao',
        dataNascimento: '1985-04-12',
        ativo: true,
      },
      adminUser
    );

    const c2Id = await criarCondutor(
      {
        nome: 'Maria Teresa dos Santos',
        bi: '007391824LA091',
        numeroCarta: 'C-0918273/LA',
        endereco: 'Avenida 4 de Fevereiro, Ingombota, Luanda',
        telefone: '+244 931 112 233',
        email: 'maria.santos@email.ao',
        dataNascimento: '1990-09-23',
        ativo: true,
      },
      adminUser
    );

    const c3Id = await criarCondutor(
      {
        nome: 'Manuel João Kapapelo',
        bi: '001928374BE012',
        numeroCarta: 'C-0482910/BE',
        endereco: 'Bairro da Graça, Benguela',
        telefone: '+244 945 998 877',
        email: 'manuel.kapapelo@email.ao',
        dataNascimento: '1978-11-05',
        ativo: true,
      },
      adminUser
    );

    // 2. Viaturas de Exemplo
    const v1Id = await criarViatura(
      {
        matricula: 'LD-45-89-FA',
        marca: 'Toyota',
        modelo: 'Hilux 2.8 D-4D',
        cor: 'Branco',
        categoria: 'Ligeiro de Mercadorias',
        numeroChassi: 'AHTFR29G409182736',
        proprietarioId: c1Id,
        proprietarioNome: 'António Domingos Silva',
        proprietarioBi: '004819283LA034',
        ativo: true,
      },
      adminUser
    );

    const v2Id = await criarViatura(
      {
        matricula: 'LD-12-78-HG',
        marca: 'Hyundai',
        modelo: 'Tucson 2.0',
        cor: 'Cinzento Metalizado',
        categoria: 'Ligeiro de Passageiros',
        numeroChassi: 'KMHJU81BDLU928172',
        proprietarioId: c2Id,
        proprietarioNome: 'Maria Teresa dos Santos',
        proprietarioBi: '007391824LA091',
        ativo: true,
      },
      adminUser
    );

    const v3Id = await criarViatura(
      {
        matricula: 'BE-33-90-AA',
        marca: 'Mitsubishi',
        modelo: 'Canter 3.5T',
        cor: 'Azul',
        categoria: 'Pesado de Mercadorias',
        numeroChassi: 'TYB91028374659102',
        proprietarioId: c3Id,
        proprietarioNome: 'Manuel João Kapapelo',
        proprietarioBi: '001928374BE012',
        ativo: true,
      },
      adminUser
    );

    // 3. Multas de Exemplo
    const m1Id = await criarMulta(
      {
        numeroMulta: 'MLT-2026-00101',
        numeroNotificacao: 'NOT-2026-00101',
        notificado: 'Sim',
        bi: '004819283LA034',
        nomeCondutor: 'António Domingos Silva',
        numeroCarta: 'C-0829103/LA',
        endereco: 'Rua Rainha Ginga, Maianga, Luanda',
        telefone: '+244 923 456 789',
        matricula: 'LD-45-89-FA',
        email: 'antonio.silva@email.ao',
        agenteId: adminUser.uid,
        agenteNome: 'Agente 1ª Classe Mateus (DTSER)',
        valorUcfKz: 88,
        ucf: 150,
        valorTotal: 13200,
        dataMulta: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        tipoInfracao: 'Excesso de Velocidade',
        descricaoArtigo: 'Artigo 27º do Código de Estrada (Circulação a 98 km/h em zona urbana de 60 km/h)',
        gravidade: 'Grave',
        tipoDocumento: 'Carta de Condução',
        statusPagamento: 'Pago',
        valorPago: 13200,
        saldoDevedor: 0,
        localInfracao: 'Avenida Deolinda Rodrigues, Luanda',
      },
      adminUser
    );

    // Pagamento para M1
    await registrarPagamento(
      {
        multaId: m1Id,
        numeroMulta: 'MLT-2026-00101',
        valorPago: 13200,
        metodoPagamento: 'Multicaixa Express',
        referencia: 'RUPE-92817290182',
        operadorId: adminUser.uid,
        operadorNome: adminUser.nome,
        observacao: 'Liquidação integral via referência RUPE bancária',
      },
      adminUser
    );

    const m2Id = await criarMulta(
      {
        numeroMulta: 'MLT-2026-00102',
        numeroNotificacao: 'NOT-2026-00102',
        notificado: 'Sim',
        bi: '007391824LA091',
        nomeCondutor: 'Maria Teresa dos Santos',
        numeroCarta: 'C-0918273/LA',
        endereco: 'Avenida 4 de Fevereiro, Ingombota, Luanda',
        telefone: '+244 931 112 233',
        matricula: 'LD-12-78-HG',
        email: 'maria.santos@email.ao',
        agenteId: adminUser.uid,
        agenteNome: 'Agente Subchefe Andrade (UPT)',
        valorUcfKz: 88,
        ucf: 100,
        valorTotal: 8800,
        dataMulta: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
        tipoInfracao: 'Uso de Telemóvel durante a Condução',
        descricaoArtigo: 'Artigo 84º do Código de Estrada',
        gravidade: 'Grave',
        tipoDocumento: 'BI',
        statusPagamento: 'Pendente',
        valorPago: 0,
        saldoDevedor: 8800,
        localInfracao: 'Largo do Kinaxixi, Luanda',
      },
      adminUser
    );

    const m3Id = await criarMulta(
      {
        numeroMulta: 'MLT-2026-00103',
        numeroNotificacao: 'NOT-2026-00103',
        notificado: 'Sim',
        bi: '001928374BE012',
        nomeCondutor: 'Manuel João Kapapelo',
        numeroCarta: 'C-0482910/BE',
        endereco: 'Bairro da Graça, Benguela',
        telefone: '+244 945 998 877',
        matricula: 'BE-33-90-AA',
        email: 'manuel.kapapelo@email.ao',
        agenteId: adminUser.uid,
        agenteNome: 'Agente 2ª Classe Domingos (Benguela)',
        valorUcfKz: 88,
        ucf: 250,
        valorTotal: 22000,
        dataMulta: new Date().toISOString().split('T')[0],
        tipoInfracao: 'Falta de Seguro Obrigatório Automóvel',
        descricaoArtigo: 'Artigo 150º do Código de Estrada',
        gravidade: 'Grave',
        tipoDocumento: 'Livrete',
        statusPagamento: 'Parcialmente Pago',
        valorPago: 10000,
        saldoDevedor: 12000,
        localInfracao: 'Estrada Nacional EN-100, Lobito-Benguela',
      },
      adminUser
    );

    // Pagamento parcial para M3
    await registrarPagamento(
      {
        multaId: m3Id,
        numeroMulta: 'MLT-2026-00103',
        valorPago: 10000,
        metodoPagamento: 'TPA (Terminal de Pagamento)',
        referencia: 'TPA-LOBITO-44910',
        operadorId: adminUser.uid,
        operadorNome: adminUser.nome,
        observacao: 'Primeira prestação de 10.000 Kz',
      },
      adminUser
    );

    console.log('Dados iniciais semeados com sucesso.');
  } catch (err) {
    console.error('Erro ao semear dados iniciais:', err);
  }
}
