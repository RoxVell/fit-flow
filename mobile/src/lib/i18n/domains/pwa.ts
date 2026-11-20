export const pwa = {
  en: {
    pendingChanges: (n: number) => (n === 1 ? `${n} pending change` : `${n} pending changes`),
    syncNow: "Sync now",
    syncing: "Syncing",
    backOnline: "Back online",
    backOnlineSyncing: (n: number) =>
      n === 1 ? `Back online — syncing ${n} change…` : `Back online — syncing ${n} changes…`,
    offlineTitle: "You're offline —",
    offlineNoPending: "changes will sync when connected",
  },
  ru: {
    pendingChanges: (n: number) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} несинхронизированное изменение`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `${n} несинхронизированных изменения`;
      }
      return `${n} несинхронизированных изменений`;
    },
    syncNow: "Синхронизировать",
    syncing: "Синхронизация...",
    backOnline: "Сеть доступна",
    backOnlineSyncing: (n: number) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `Сеть доступна — синхронизируется ${n} изменение…`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `Сеть доступна — синхронизируются ${n} изменения…`;
      }
      return `Сеть доступна — синхронизируются ${n} изменений…`;
    },
    offlineTitle: "Вы офлайн —",
    offlineNoPending: "изменения синхронизируются при подключении",
  },
} as const;
