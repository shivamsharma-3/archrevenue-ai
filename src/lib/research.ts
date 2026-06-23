import { CompanyKnowledge } from './types';
import { checkTokenLimit } from './usage';
import { auth } from './firebase';

export async function researchCompany(url: string): Promise<CompanyKnowledge> {
  const userId = auth.currentUser?.uid;
  if (userId) {
    await checkTokenLimit(userId);
  }

  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('/api/researchCompany', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}
