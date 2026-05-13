import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'clinix.mobile.patient.reminders.v1';
const listeners = new Set();

const defaultStore = {
    morning: [
        {
            id: 'default-1',
            section: 'morning',
            bucket: 'today',
            type: 'vitamin',
            title: 'Take Vitamin D',
            subtitle: '08:00 AM - 1 capsule',
            primaryAction: 'Mark Done',
        },
        {
            id: 'default-2',
            section: 'morning',
            bucket: 'today',
            type: 'bp',
            title: 'Blood Pressure Check',
            subtitle: '09:00 AM - Log reading',
            primaryAction: 'Log Data',
        },
    ],
    afternoon: [
        {
            id: 'default-3',
            section: 'afternoon',
            bucket: 'today',
            type: 'hydration',
            title: 'Drink Water',
            subtitle: '02:00 PM - 2 glasses',
            primaryAction: 'Mark Done',
        },
    ],
    completed: [],
};

let store = defaultStore;
let hydrated = false;

const notify = () => {
    listeners.forEach((fn) => fn(store));
};

const persist = () => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store)).catch(() => {});
};

const normalizeStore = (value) => ({
    morning: Array.isArray(value?.morning) ? value.morning : defaultStore.morning,
    afternoon: Array.isArray(value?.afternoon) ? value.afternoon : defaultStore.afternoon,
    completed: Array.isArray(value?.completed) ? value.completed : defaultStore.completed,
});

export const remindersStore = {
    get: () => store,
    hydrate: async () => {
        if (hydrated) return store;
        hydrated = true;

        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                store = normalizeStore(JSON.parse(raw));
                notify();
            }
        } catch {
            store = defaultStore;
            notify();
        }

        return store;
    },
    set: (next) => {
        store = normalizeStore(next);
        persist();
        notify();
    },
    add: (item) => {
        const slot = item.slot === 'afternoon' ? 'afternoon' : 'morning';
        const bucket = item.bucket === 'upcoming' ? 'upcoming' : 'today';
        const newItem = { ...item, id: `r-${Date.now()}`, section: slot, bucket };
        store = { ...store, [slot]: [newItem, ...store[slot]] };
        persist();
        notify();
    },
    subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};
