export function useRegisterSW() {
  const noop = () => undefined;
  return {
    needRefresh: [false, noop] as const,
    offlineReady: [false, noop] as const,
    updateServiceWorker: async () => undefined,
  };
}
