import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type LogType = 'info' | 'success' | 'warn' | 'error';

export interface SystemLog {
  id?: string;
  event: string;
  type: LogType;
  target?: string;
  ip?: string;
  timestamp: any;
}

export const logSystemEvent = async (event: string, type: LogType, target?: string, ip?: string) => {
  try {
    await addDoc(collection(db, 'system_logs'), {
      event,
      type,
      target: target || null,
      ip: ip || null,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to write system log:', error);
  }
};
