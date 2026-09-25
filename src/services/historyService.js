import { getCategoryEmoji } from './categoryService.js';
import { ExpoSecureStoreAdapter } from './supabase.js';

const STORAGE_KEY = 'waste_app_scan_history_v2';

// Default starter history items so user sees an active activity log
const INITIAL_HISTORY = [
  {
    id: 'scan-1',
    title: 'Plastic Beverage Bottle',
    category: 'Plastics',
    modelClass: 'plastic_bottle',
    superCategory: 'plastic',
    date: 'Today, 10:14 AM',
    timestamp: Date.now() - 1000 * 60 * 35,
    points: 15,
    weightKg: 0.05,
    binColor: '#EAB308',
    status: 'Diverted to Yellow Bin',
    emoji: getCategoryEmoji('plastic_bottle'),
    confidence: 0.94,
  },
  {
    id: 'scan-2',
    title: 'Corrugated Shipping Box',
    category: 'Paper & Cardboard',
    modelClass: 'cardboard_box',
    superCategory: 'cardboard',
    date: 'Yesterday, 4:30 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 20,
    points: 25,
    weightKg: 0.45,
    binColor: '#2563EB',
    status: 'Flattened & Recycled',
    emoji: getCategoryEmoji('cardboard_box'),
    confidence: 0.91,
  },
  {
    id: 'scan-3',
    title: 'Aluminium Beverage Can',
    category: 'Metals',
    modelClass: 'beverage_can',
    superCategory: 'metal',
    date: 'Sep 17, 1:15 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    points: 20,
    weightKg: 0.15,
    binColor: '#65A30D',
    status: 'Cleaned & Sorted',
    emoji: getCategoryEmoji('beverage_can'),
    confidence: 0.88,
  },
  {
    id: 'scan-4',
    title: 'Glass Jar / Container',
    category: 'Glass',
    modelClass: 'glass_container',
    superCategory: 'glass',
    date: 'Sep 15, 6:45 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    points: 30,
    weightKg: 0.65,
    binColor: '#16A34A',
    status: 'Sent to Greenciti Hub',
    emoji: getCategoryEmoji('glass_container'),
    confidence: 0.96,
  },
];

let memoryHistory = [...INITIAL_HISTORY];
const listeners = new Set();
let isInitialized = false;

// Auto-load saved history from persistent storage on startup
const initStorage = async () => {
  if (isInitialized) return;
  try {
    const raw = await ExpoSecureStoreAdapter.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryHistory = parsed;
        notifyListeners();
      }
    }
  } catch (err) {
    console.warn('Could not load scan history from storage:', err);
  } finally {
    isInitialized = true;
  }
};

initStorage();

const saveToStorage = async () => {
  try {
    await ExpoSecureStoreAdapter.setItem(STORAGE_KEY, JSON.stringify(memoryHistory));
  } catch (err) {
    console.warn('Could not persist scan history:', err);
  }
};

export const subscribeHistory = (listener) => {
  listeners.add(listener);
  initStorage();
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...memoryHistory]));
};

export const getHistory = () => {
  initStorage();
  return [...memoryHistory];
};

export const addHistoryItem = (item) => {
  const emoji = item.emoji || getCategoryEmoji(item.modelClass || item.category || 'scrap');
  const newItem = {
    id: 'scan-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    title: item.title || item.name || 'Scrap Item',
    category: item.category || item.superCategory || 'Dry Waste',
    modelClass: item.modelClass || 'waste',
    superCategory: item.superCategory || 'scrap',
    date: 'Just now',
    timestamp: Date.now(),
    points: item.points || 20,
    weightKg: item.weightKg || 0.25,
    binColor: item.binColor || '#16A34A',
    status: item.status || 'Classified & Diverted',
    emoji: emoji,
    confidence: item.confidence || 0.90,
    photoUri: item.photoUri || null,
  };

  memoryHistory = [newItem, ...memoryHistory];
  notifyListeners();
  saveToStorage();
  return newItem;
};

export const clearHistory = () => {
  memoryHistory = [];
  notifyListeners();
  saveToStorage();
};

export const getHistoryStats = () => {
  const totalScans = memoryHistory.length;
  const totalPoints = memoryHistory.reduce((acc, curr) => acc + (curr.points || 0), 0);
  const totalWeight = memoryHistory.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
  const recycleRate = totalScans > 0 ? 100 : 0;

  return {
    totalScans,
    totalPoints,
    totalWeight: totalWeight.toFixed(2),
    recycleRate,
  };
};