import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { LogAuditoria } from '../types';

export async function registrarLogAuditoria(
  log: Omit<LogAuditoria, 'id' | 'dataHora'>
): Promise<void> {
  try {
    const logsRef = collection(db, 'logsAuditoria');
    await addDoc(logsRef, {
      ...log,
      dataHora: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}
