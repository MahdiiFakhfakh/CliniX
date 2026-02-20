import AsyncStorage from '@react-native-async-storage/async-storage';
import { MutationCache, QueryCache, onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, type PropsWithChildren } from 'react';

import { showErrorToast } from '@/src/store/toastStore';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;
const QUERY_CACHE_STORAGE_KEY = 'clinix.mobile.react-query-cache';

function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Request failed. Please try again.';
  }

  const message = error.message.trim();
  if (!message) {
    return 'Request failed. Please try again.';
  }

  return message;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      showErrorToast(extractErrorMessage(error), 'Unable to load data.');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      showErrorToast(extractErrorMessage(error), 'Action failed.');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: ONE_DAY_MS,
      retry: 1,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_STORAGE_KEY,
});

export async function clearAppQueryCache(): Promise<void> {
  queryClient.clear();
  await persister.removeClient?.();
  await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
}

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
        setOnline(isOnline);
      });
    });
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: ONE_DAY_MS,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
