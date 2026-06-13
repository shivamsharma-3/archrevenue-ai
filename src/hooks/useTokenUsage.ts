import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { TokenUsage, DEFAULT_TOKEN_LIMIT } from '../lib/usage';

export function useTokenUsage() {
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [limit, setLimit] = useState<number>(DEFAULT_TOKEN_LIMIT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const usageRef = doc(db, 'users', userId, 'usage', 'tokens');
    
    const unsubscribe = onSnapshot(
      usageRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as TokenUsage;
          setTokensUsed(data.tokensUsed || 0);
          setLimit(data.limit ?? DEFAULT_TOKEN_LIMIT);
        } else {
          setTokensUsed(0);
          setLimit(DEFAULT_TOKEN_LIMIT);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching token usage:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tokensUsed, limit, isLoading, error };
}
