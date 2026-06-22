import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export type ServiceStatus = 'operational' | 'degraded' | 'offline';

export interface SystemMetrics {
  isOnline: boolean;
  dbLatency: number | null;
  dbStatus: ServiceStatus;
  authStatus: ServiceStatus;
  overallStatus: ServiceStatus;
}

export function useSystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    isOnline: navigator.onLine,
    dbLatency: null,
    dbStatus: navigator.onLine ? 'operational' : 'offline',
    authStatus: navigator.onLine ? 'operational' : 'offline',
    overallStatus: navigator.onLine ? 'operational' : 'offline'
  });

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false, dbStatus: 'offline', authStatus: 'offline', overallStatus: 'offline', dbLatency: null }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let isMounted = true;

    // Ping function to test Firestore
    const pingDatabase = async () => {
      if (!navigator.onLine) return;
      
      const start = performance.now();
      try {
        // A lightweight query to test connection
        await getDocs(query(collection(db, 'leads'), limit(1)));
        const latency = Math.round(performance.now() - start);
        
        if (isMounted) {
          const status: ServiceStatus = latency > 1500 ? 'degraded' : 'operational';
          setMetrics(prev => {
            const authStat = auth ? 'operational' : 'offline';
            return {
              ...prev,
              dbLatency: latency,
              dbStatus: status,
              authStatus: authStat,
              overallStatus: status === 'degraded' || authStat === 'offline' ? 'degraded' : 'operational'
            };
          });
        }
      } catch (error: any) {
        if (isMounted) {
          // If we get a permission-denied error, it means we successfully reached the database!
          if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            const latency = Math.round(performance.now() - start);
            const status: ServiceStatus = latency > 1500 ? 'degraded' : 'operational';
            setMetrics(prev => {
              const authStat = auth ? 'operational' : 'offline';
              return {
                ...prev,
                dbLatency: latency,
                dbStatus: status,
                authStatus: authStat,
                overallStatus: status === 'degraded' || authStat === 'offline' ? 'degraded' : 'operational'
              };
            });
          } else {
            console.error('Database ping failed:', error);
            setMetrics(prev => ({
              ...prev,
              dbLatency: null,
              dbStatus: 'offline',
              overallStatus: 'offline'
            }));
          }
        }
      }
    };

    // Initial ping
    pingDatabase();

    // Ping every 30 seconds
    const interval = setInterval(pingDatabase, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return metrics;
}
