export type PerfilUtilizador = 'Administrador' | 'Agente' | 'Consulta';

export type StatusPagamento = 'Pendente' | 'Pago' | 'Parcialmente Pago' | 'Cancelado';

export type GravidadeInfracao = 'Leve' | 'Grave' | 'Muito Grave';

export type TipoDocumento = 'BI' | 'Carta de Condução' | 'Passaporte' | 'Livrete' | 'Outro';

export type MetodoPagamento = 
  | 'Multicaixa Express' 
  | 'TPA (Terminal de Pagamento)' 
  | 'Transferência Bancária' 
  | 'Depósito Bancário' 
  | 'Numerário / Caixa';

export interface Condutor {
  id?: string;
  nome: string;
  bi: string;
  numeroCarta: string;
  endereco: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  dataRegisto: string;
  ativo: boolean;
}

export interface Viatura {
  id?: string;
  matricula: string;
  marca: string;
  modelo: string;
  cor: string;
  categoria: string;
  numeroChassi: string;
  proprietarioId?: string;
  proprietarioNome?: string;
  proprietarioBi?: string;
  dataRegisto: string;
  ativo: boolean;
}

export interface Multa {
  id?: string;
  numeroMulta: string;
  notificado: 'Sim' | 'Não';
  bi: string;
  nomeCondutor?: string;
  numeroCarta: string;
  endereco: string;
  telefone: string;
  matricula: string;
  email: string;
  agenteId: string;
  agenteNome: string;
  valorUcfKz: number;
  ucf: number;
  valorTotal: number;
  dataMulta: string;
  dataRegisto: string;
  tipoInfracao: string;
  descricaoArtigo: string;
  gravidade: GravidadeInfracao;
  numeroNotificacao: string;
  tipoDocumento: TipoDocumento;
  statusPagamento: StatusPagamento;
  valorPago?: number;
  saldoDevedor?: number;
  observacoes?: string;
  localInfracao?: string;
}

export interface Pagamento {
  id?: string;
  multaId: string;
  numeroMulta: string;
  valorPago: number;
  dataPagamento: string;
  metodoPagamento: MetodoPagamento;
  referencia: string;
  operadorId: string;
  operadorNome: string;
  observacao?: string;
}

export interface Utilizador {
  id?: string;
  uid: string;
  nome: string;
  email: string;
  bi: string;
  perfil: PerfilUtilizador;
  ativo: boolean;
  dataCriacao: string;
  ultimoAcesso: string;
  cargo?: string;
}

export interface LogAuditoria {
  id?: string;
  utilizadorId: string;
  utilizadorNome: string;
  utilizadorEmail: string;
  acao: 'Criação' | 'Edição' | 'Pagamento' | 'Exclusão' | 'Alteração de Permissões' | 'Login' | 'Consulta';
  dataHora: string;
  recurso: 'condutores' | 'viaturas' | 'multas' | 'pagamentos' | 'utilizadores' | 'sistema';
  documentoId: string;
  detalhes?: string;
}

export interface InfracaoPadrao {
  codigo: string;
  tipoInfracao: string;
  artigo: string;
  gravidade: GravidadeInfracao;
  ucf: number;
  descricao: string;
}
