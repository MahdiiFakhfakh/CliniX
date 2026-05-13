const listeners = new Set();

let store = {
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

export const remindersStore = {
    get: () => store,
    set: (next) => {
        store = next;
        listeners.forEach((fn) => fn(store));
    },
    add: (item) => {
        const slot = item.slot === 'afternoon' ? 'afternoon' : 'morning';
        const newItem = { ...item, id: `r-${Date.now()}`, section: slot, bucket: 'today' };
        store = { ...store, [slot]: [newItem, ...store[slot]] };
        listeners.forEach((fn) => fn(store));
    },
    subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};
