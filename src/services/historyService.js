import { getCategoryEmoji } from './categoryService.js';
import supabase, { ExpoSecureStoreAdapter } from './supabase.js';
import { formatWhen } from '../utils/date';

// Scan history per account.
// - Signed-in accounts: stored in the Supabase `scan_history` table (follows the account across devices).
// - Guests: not signed in to Supabase, so their history stays on this device.
// AuthContext calls setHistoryUser() whenever the account changes.
const LOCAL_PREFIX = 'waste_app_scan_history_v3_';
const LEGACY_KEY = 'waste_app_scan_history_v2'; // old shared key that held demo scans

let memoryHistory = [];
let currentUserId = null;
let isRemote = false;
const listeners = new Set();

ExpoSecureStoreAdapter.removeItem(LEGACY_KEY).catch(() => {});

const localKeyFor = (userId) => LOCAL_PREFIX + String(userId).replace(/[^A-Za-z0-9._-]/g, '_');

const notifyListeners = () => {
  const items = getHistory();
  listeners.forEach((listener) => listener(items));
};

const fromRow = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  modelClass: row.model_class,
  superCategory: row.super_category,
  timestamp: new Date(row.created_at).getTime(),
  points: row.points || 0,
  weightKg: Number(row.weight_kg) || 0,
  binColor: row.bin_color,
  status: row.status,
  emoji: row.emoji,
  confidence: row.confidence,
  photoUri: null, // photos are not uploaded for scans
});

const toRow = (item) => ({
  title: item.title,
  category: item.category,
  model_class: item.modelClass,
  super_category: item.superCategory,
  points: item.points,
  weight_kg: item.weightKg,
  bin_color: item.binColor,
  status: item.status,
  emoji: item.emoji,
  confidence: item.confidence,
  created_at: new Date(item.timestamp).toISOString(),
});

const saveLocal = async () => {
  if (!currentUserId || isRemote) return;
  try {
    await ExpoSecureStoreAdapter.setItem(localKeyFor(currentUserId), JSON.stringify(memoryHistory));
  } catch (err) {
    console.warn('Could not save scan history on this device:', err);
  }
};

const readLocal = async (userId) => {
  try {
    const raw = await ExpoSecureStoreAdapter.getItem(localKeyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

// Scans saved on this device before the move to Supabase are uploaded once, then removed locally
const migrateLocalToRemote = async (userId) => {
  const local = await readLocal(userId);
  if (local.length === 0) return;
  const { error } = await supabase.from('scan_history').insert(local.map(toRow));
  if (error) {
    console.warn('Could not upload saved scans to Supabase:', error.message);
    return;
  }
  await ExpoSecureStoreAdapter.removeItem(localKeyFor(userId));
};

const loadRemote = async () => {
  const { data, error } = await supabase
    .from('scan_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []).map(fromRow);
};

// Switch to the given account's history. `user` is the signed-in user, or null when signed out.
export const setHistoryUser = async (user) => {
  const userId = user?.id || null;
  const remote = !!user && user.app_metadata?.provider !== 'guest';
  if (userId === currentUserId && remote === isRemote) return;

  currentUserId = userId;
  isRemote = remote;
  memoryHistory = [];
  notifyListeners();
  if (!userId) return;

  try {
    let items;
    if (remote) {
      await migrateLocalToRemote(userId);
      items = await loadRemote();
    } else {
      items = await readLocal(userId);
    }
    if (userId !== currentUserId) return; // account changed while loading
    memoryHistory = items;
    notifyListeners();
  } catch (err) {
    console.warn('Could not load scan history:', err?.message || err);
  }
};

export const refreshHistory = async () => {
  if (!currentUserId || !isRemote) return;
  try {
    const userId = currentUserId;
    const items = await loadRemote();
    if (userId !== currentUserId) return;
    memoryHistory = items;
    notifyListeners();
  } catch (err) {
    console.warn('Could not refresh scan history:', err?.message || err);
  }
};

export const subscribeHistory = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Dates are worked out on read so "Today, 10:14 AM" stays correct
export const getHistory = () => memoryHistory.map((item) => ({ ...item, date: formatWhen(item.timestamp) }));

export const addHistoryItem = (item) => {
  const emoji = item.emoji || getCategoryEmoji(item.modelClass || item.category || 'scrap');
  const newItem = {
    id: 'scan-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    title: item.title || item.name || 'Scrap Item',
    category: item.category || item.superCategory || 'Dry Waste',
    modelClass: item.modelClass || 'waste',
    superCategory: item.superCategory || 'scrap',
    timestamp: Date.now(),
    points: item.points || 20,
    weightKg: item.weightKg || 0.25,
    binColor: item.binColor || '#16A34A',
    status: item.status || 'Classified & Diverted',
    emoji: emoji,
    confidence: item.confidence || 0.9,
    photoUri: item.photoUri || null,
  };

  memoryHistory = [newItem, ...memoryHistory];
  notifyListeners();

  if (isRemote) {
    const userId = currentUserId;
    supabase
      .from('scan_history')
      .insert(toRow(newItem))
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Could not save scan to Supabase:', error.message);
          return;
        }
        if (userId !== currentUserId) return;
        // Swap the temporary id for the database id, keep the local photo for this session
        memoryHistory = memoryHistory.map((h) =>
          h.id === newItem.id ? { ...fromRow(data), photoUri: newItem.photoUri } : h
        );
        notifyListeners();
      });
  } else {
    saveLocal();
  }
  return newItem;
};

export const clearHistory = async () => {
  memoryHistory = [];
  notifyListeners();
  if (isRemote && currentUserId) {
    const { error } = await supabase.from('scan_history').delete().eq('user_id', currentUserId);
    if (error) console.warn('Could not clear scan history in Supabase:', error.message);
  } else {
    saveLocal();
  }
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
