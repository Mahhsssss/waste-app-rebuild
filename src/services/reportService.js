// services/reportService.js

// Sample initial trash dump reports in the city for the interactive map
const INITIAL_REPORTS = [
  {
    id: 'dump-1',
    title: 'Plastic Pile near Lake Drainage',
    wasteType: 'Plastic & Polythene Bags',
    severity: 'Urgent Hazard',
    severityLevel: 'critical',
    address: 'Near Bhandup Lake Inlet, LBS Marg',
    latitude: 19.145,
    longitude: 72.932,
    date: '2 hours ago',
    timestamp: Date.now() - 1000 * 60 * 120,
    status: 'Pending Municipal Review',
    statusColor: '#DC2626',
    reportedBy: 'You (Citizen)',
    isMyReport: true,
    notes: 'Severe blockage in stormwater canal, foul odor and plastic packaging accumulating.',
    photoUri: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400',
    authority: 'BMC Solid Waste Management Dept (mcgm.swmproject@gmail.com)',
  },
  {
    id: 'dump-2',
    title: 'Discarded Electronic Hardware & Cables',
    wasteType: 'E-Waste & Scrap Metal',
    severity: 'Moderate Spill',
    severityLevel: 'moderate',
    address: 'Plot 14, Industrial Estate Road, Kanjurmarg West',
    latitude: 19.135,
    longitude: 72.932,
    date: 'Yesterday, 3:15 PM',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    status: 'Assigned to Cleanup Crew',
    statusColor: '#D97706',
    reportedBy: 'Local Resident (Civic Alert)',
    isMyReport: false,
    notes: 'Stripped copper wires and computer chassis dumped on sidewalk.',
    photoUri: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400',
    authority: 'Central Pollution Control Board (cpcb@nic.in)',
  },
  {
    id: 'dump-3',
    title: 'Overflowing Commercial Cardboard Heap',
    wasteType: 'Cardboard & Paper Scrap',
    severity: 'Minor Litter',
    severityLevel: 'minor',
    address: 'Bhandup Station Market Road, Ward S',
    latitude: 19.144,
    longitude: 72.937,
    date: 'Sep 17, 11:00 AM',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    status: 'Cleared & Diverted',
    statusColor: '#16A34A',
    reportedBy: 'You (Citizen)',
    isMyReport: true,
    notes: 'Flattened boxes collected by licensed paper mill recyclers.',
    photoUri: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    authority: 'Swachh Bharat Mission (support@sbmurban.org)',
  },
];

import { ExpoSecureStoreAdapter } from './supabase.js';

const STORAGE_KEY = 'waste_app_dump_reports_v2';

let memoryReports = [...INITIAL_REPORTS];
const listeners = new Set();
let isInitialized = false;

// Auto-load saved dump reports from persistent storage on startup
const initStorage = async () => {
  if (isInitialized) return;
  try {
    const raw = await ExpoSecureStoreAdapter.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryReports = parsed;
        notifyListeners();
      }
    }
  } catch (err) {
    console.warn('Could not load dump reports from storage:', err);
  } finally {
    isInitialized = true;
  }
};

initStorage();

const saveToStorage = async () => {
  try {
    await ExpoSecureStoreAdapter.setItem(STORAGE_KEY, JSON.stringify(memoryReports));
  } catch (err) {
    console.warn('Could not persist dump reports:', err);
  }
};

export const subscribeReports = (listener) => {
  listeners.add(listener);
  initStorage();
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...memoryReports]));
};

export const getReports = () => {
  initStorage();
  return [...memoryReports];
};

export const getMyReports = () => {
  initStorage();
  return memoryReports.filter((r) => r.isMyReport);
};

export const submitReport = (report) => {
  const newReport = {
    id: `dump-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: report.title || `Waste Dump Report (${report.wasteType || 'General'})`,
    wasteType: report.wasteType || 'Unclassified Waste',
    severity: report.severity || 'Critical Hazard',
    severityLevel: report.severityLevel || 'critical',
    address: report.address || 'Reported Location',
    latitude: report.latitude || 19.145,
    longitude: report.longitude || 72.932,
    date: 'Just now',
    timestamp: Date.now(),
    status: 'Pending Municipal Review',
    statusColor: '#DC2626',
    reportedBy: 'You (Citizen)',
    isMyReport: true,
    notes: report.notes || '',
    additionalMessage: report.additionalMessage || '',
    photoUri: report.photoUri || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400',
    authority: report.authority || 'BMC Solid Waste Management (MCGM)',
  };

  memoryReports = [newReport, ...memoryReports];
  notifyListeners();
  saveToStorage();
  return newReport;
};
