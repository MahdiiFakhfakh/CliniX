import { useNetInfo } from '@react-native-community/netinfo';
import { useMemo } from 'react';

export function useOfflineStatus(): { isOffline: boolean } {
  const netInfo = useNetInfo();

  return useMemo(() => {
    const isOffline = !netInfo.isConnected || netInfo.isInternetReachable === false;
    return { isOffline };
  }, [netInfo.isConnected, netInfo.isInternetReachable]);
}
