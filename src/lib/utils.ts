import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Lead } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFollowUpStatus = (lead: Lead): Lead['followUpStatus'] => {
  if (lead.followUpStatus === 'completed') return 'completed';
  if (!lead.followUpDate) return undefined;
  
  let d: Date;
  if (lead.followUpDate.toDate) d = lead.followUpDate.toDate();
  else if (lead.followUpDate instanceof Date) d = lead.followUpDate;
  else d = new Date(lead.followUpDate);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpDay = new Date(d);
  followUpDay.setHours(0, 0, 0, 0);
  
  if (followUpDay.getTime() === today.getTime()) return 'due_today';
  else if (followUpDay.getTime() < today.getTime()) return 'overdue';
  else return 'scheduled';
};
