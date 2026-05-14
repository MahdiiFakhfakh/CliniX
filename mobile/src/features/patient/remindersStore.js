import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = 'clinix.mobile.patient.reminders.v2';
const listeners = new Set();

const emptyStore = {
    morning: [],
    afternoon: [],
    completed: [],
};

let store = emptyStore;
let hydrated = false;
let activeStorageKey = `${STORAGE_KEY_PREFIX}:guest`;

const notify = () => {
    listeners.forEach((fn) => fn(store));
};

const persist = () => {
    void AsyncStorage.setItem(activeStorageKey, JSON.stringify(store)).catch(() => {});
};

const normalizeStore = (value, fallback = emptyStore) => ({
    morning: Array.isArray(value?.morning) ? value.morning : fallback.morning,
    afternoon: Array.isArray(value?.afternoon) ? value.afternoon : fallback.afternoon,
    completed: Array.isArray(value?.completed) ? value.completed : fallback.completed,
});

const storageKeyFor = (patientKey) => `${STORAGE_KEY_PREFIX}:${patientKey || 'guest'}`;

const uniqueStrings = (items) => {
    const seen = new Set();
    return (Array.isArray(items) ? items : [])
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .map((item) => item?.trim())
        .filter(Boolean)
        .filter((item) => {
            const key = item.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
};

export const buildPatientCareSeed = (summary = {}) => {
    const medications = uniqueStrings(summary.activeMedications);
    const conditions = uniqueStrings(summary.chronicConditions);
    const conditionText = conditions.join(' ').toLowerCase();
    const morning = medications.slice(0, 3).map((name, index) => ({
        id: `seed-med-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        section: 'morning',
        bucket: 'today',
        type: 'vitamin',
        title: `Take ${name}`,
        subtitle: '08:00 AM - As prescribed',
        primaryAction: 'Mark Done',
    }));
    const afternoon = medications.slice(3, 6).map((name, index) => ({
        id: `seed-med-afternoon-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        section: 'afternoon',
        bucket: 'today',
        type: 'vitamin',
        title: `Take ${name}`,
        subtitle: '02:00 PM - As prescribed',
        primaryAction: 'Mark Done',
    }));

    if (conditionText.includes('hypertension') || conditionText.includes('blood pressure')) {
        morning.push({
            id: 'seed-blood-pressure',
            section: 'morning',
            bucket: 'today',
            type: 'bp',
            title: 'Blood Pressure Check',
            subtitle: '09:00 AM - Log reading',
            primaryAction: 'Log Data',
        });
    }

    if (conditionText.includes('diabetes') || conditionText.includes('glucose')) {
        afternoon.push({
            id: 'seed-glucose-check',
            section: 'afternoon',
            bucket: 'today',
            type: 'bp',
            title: 'Glucose Check',
            subtitle: '02:00 PM - Log reading',
            primaryAction: 'Log Data',
        });
    }

    return normalizeStore({ morning, afternoon, completed: [] });
};

export const remindersStore = {
    get: () => store,
    hydrate: async (patientKey = 'guest', seed = emptyStore) => {
        const nextStorageKey = storageKeyFor(patientKey);
        const fallback = normalizeStore(seed);

        if (activeStorageKey !== nextStorageKey) {
            activeStorageKey = nextStorageKey;
            hydrated = false;
            store = fallback;
            notify();
        }

        if (hydrated) return store;
        hydrated = true;

        try {
            const raw = await AsyncStorage.getItem(activeStorageKey);
            store = raw ? normalizeStore(JSON.parse(raw), fallback) : fallback;
            notify();
        } catch {
            store = fallback;
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
