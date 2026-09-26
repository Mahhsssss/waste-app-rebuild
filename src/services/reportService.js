// services/reportService.js
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import supabase, { ExpoSecureStoreAdapter } from './supabase.js';
import { formatWhen } from '../utils/date';

// Dump reports.
// - Everyone's reports are read from the Supabase `dump_reports` table, so the map is a real community map.
// - Signed-in accounts save their reports (and photos, in the `report-photos` bucket) to Supabase.
// - Guests are not signed in to Supabase, so reports they submit stay on this device.
// AuthContext calls setReportsUser() whenever the account changes.
const PHOTO_BUCKET = 'report-photos';
const LOCAL_PREFIX = 'waste_app_dump_reports_v3_';
const LEGACY_KEY = 'waste_app_dump_reports_v2'; // old shared key

const STATUS_COLORS = {
  'Pending Municipal Review': '#DC2626',
  'Assigned to Cleanup Crew': '#D97706',
  'Cleared & Diverted': '#16A34A',
};

let remoteReports = []; // from Supabase (everyone's)
let localReports = []; // guest reports kept on this device
let currentUserId = null;
let isRemote = false;
const listeners = new Set();

ExpoSecureStoreAdapter.removeItem(LEGACY_KEY).catch(() => {});

const localKeyFor = (userId) => LOCAL_PREFIX + String(userId).replace(/[^A-Za-z0-9._-]/g, '_');

const withDisplayFields = (r) => ({
  ...r,
  date: formatWhen(r.timestamp),
  statusColor: STATUS_COLORS[r.status] || '#DC2626',
  isMyReport: r.isLocal || (!!currentUserId && r.userId === currentUserId),
});

const allReports = () =>
  [...localReports, ...remoteReports]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(withDisplayFields);

const notifyListeners = () => {
  const reports = allReports();
  listeners.forEach((listener) => listener(reports));
};

const fromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  wasteType: row.waste_type,
  severity: row.severity,
  severityLevel: row.severity_level,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  timestamp: new Date(row.created_at).getTime(),
  status: row.status,
  notes: row.notes || '',
  additionalMessage: row.additional_message || '',
  photoUri: row.photo_url || null,
  authority: row.authority,
});

const saveLocal = async () => {
  if (!currentUserId || isRemote) return;
  try {
    await ExpoSecureStoreAdapter.setItem(localKeyFor(currentUserId), JSON.stringify(localReports));
  } catch (err) {
    console.warn('Could not save reports on this device:', err);
  }
};

const readLocal = async (userId) => {
  try {
    const raw = await ExpoSecureStoreAdapter.getItem(localKeyFor(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((r) => ({ ...r, isLocal: true })) : [];
  } catch (err) {
    return [];
  }
};

// Uploads a photo taken on this phone and returns its public URL (null if it can't be uploaded)
const uploadPhoto = async (uri, userId) => {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  try {
    let body;
    if (Platform.OS === 'web') {
      body = await (await fetch(uri)).blob();
    } else {
      body = await new File(uri).arrayBuffer();
    }
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.warn('Could not upload report photo:', err?.message || err);
    return null;
  }
};

// Reload everyone's reports from Supabase (the map calls this when it opens)
export const refreshReports = async () => {
  const { data, error } = await supabase
    .from('dump_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    console.warn('Could not load dump reports:', error.message);
    return;
  }
  remoteReports = (data || []).map(fromRow);
  notifyListeners();
};

// Switch to the given account. `user` is the signed-in user, or null when signed out.
export const setReportsUser = async (user) => {
  const userId = user?.id || null;
  const remote = !!user && user.app_metadata?.provider !== 'guest';
  if (userId === currentUserId && remote === isRemote) return;

  currentUserId = userId;
  isRemote = remote;
  localReports = userId && !remote ? await readLocal(userId) : [];
  if (userId !== currentUserId) return; // account changed while loading
  notifyListeners();
  refreshReports();
};

export const subscribeReports = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getReports = () => allReports();

export const getMyReports = () => allReports().filter((r) => r.isMyReport);

// Path of a photo inside the report-photos bucket, from its public URL (null if it isn't ours)
const photoPathFromUrl = (url) => {
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
  const i = url ? url.indexOf(marker) : -1;
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
};

// Deletes one of the current user's own reports (and its photo). Throws with a readable message if it fails.
export const deleteReport = async (report) => {
  if (!report?.isMyReport) throw new Error('You can only delete your own reports.');

  if (report.isLocal) {
    localReports = localReports.filter((r) => r.id !== report.id);
    notifyListeners();
    saveLocal();
    return;
  }

  // .select() returns the deleted rows, so a delete blocked by permissions doesn't look like success
  const { data, error } = await supabase.from('dump_reports').delete().eq('id', report.id).select('id');
  if (error || !data || data.length === 0) {
    if (error) console.warn('Could not delete report:', error.message);
    throw new Error('This report could not be deleted. Check your internet connection and try again.');
  }

  const photoPath = photoPathFromUrl(report.photoUri);
  if (photoPath) {
    const { error: photoError } = await supabase.storage.from(PHOTO_BUCKET).remove([photoPath]);
    if (photoError) console.warn('Report deleted, but its photo could not be removed:', photoError.message);
  }

  remoteReports = remoteReports.filter((r) => r.id !== report.id);
  notifyListeners();
};

// Saves a new report. Returns the saved report; throws with a readable message if it fails.
export const submitReport = async (report) => {
  const base = {
    title: report.title || `Waste Dump Report (${report.wasteType || 'General'})`,
    wasteType: report.wasteType || 'Unclassified Waste',
    severity: report.severity || 'Critical Hazard',
    severityLevel: report.severityLevel || 'critical',
    address: report.address || 'Reported Location',
    latitude: report.latitude || 19.145,
    longitude: report.longitude || 72.932,
    status: 'Pending Municipal Review',
    notes: report.notes || '',
    additionalMessage: report.additionalMessage || '',
    authority: report.authority || 'BMC Solid Waste Management (MCGM)',
  };

  if (!isRemote) {
    const localReport = {
      ...base,
      id: `dump-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      photoUri: report.photoUri || null,
      isLocal: true,
    };
    localReports = [localReport, ...localReports];
    notifyListeners();
    saveLocal();
    return withDisplayFields(localReport);
  }

  const photoUrl = await uploadPhoto(report.photoUri, currentUserId);
  const { data, error } = await supabase
    .from('dump_reports')
    .insert({
      title: base.title,
      waste_type: base.wasteType,
      severity: base.severity,
      severity_level: base.severityLevel,
      address: base.address,
      latitude: base.latitude,
      longitude: base.longitude,
      status: base.status,
      notes: base.notes,
      additional_message: base.additionalMessage,
      photo_url: photoUrl,
      authority: base.authority,
    })
    .select()
    .single();

  if (error) {
    console.warn('Could not save report to Supabase:', error.message);
    throw new Error('Your report could not be saved. Check your internet connection and try again.');
  }

  const saved = fromRow(data);
  remoteReports = [saved, ...remoteReports.filter((r) => r.id !== saved.id)];
  notifyListeners();
  return withDisplayFields(saved);
};
