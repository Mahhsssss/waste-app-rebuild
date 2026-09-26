import React, { useState, useEffect, useMemo, useRef, useCallback, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
  Alert,
  TextInput,
  Animated,
  PanResponder,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors, spacing, radius } from '../globalStyles';
import { getReports, subscribeReports, refreshReports, deleteReport } from '../services/reportService';
import showAlert from '../utils/alert';
import { DEFAULT_RECOVERY_HUBS, fetchRecoveryHubs } from '../services/hubService';
import { getCurrentCoords } from '../utils/location';

const TYPE_META = {
  centre: { label: 'Recycling centre', icon: 'business', color: '#2E7D32', tint: '#E8F5E9' },
  dump: { label: 'Dump report', icon: 'warning', color: '#DC2626', tint: '#FEE2E2' },
  mine: { label: 'Your report', icon: 'person', color: '#D97706', tint: '#FEF3C7' },
};

// Filter keys stay the same as before because other screens pass them as route params
const FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'NGOs', label: 'Recycling Centres', color: TYPE_META.centre.color },
  { key: 'Trash Dumps', label: 'Dumps', color: TYPE_META.dump.color },
  { key: 'My Reports', label: 'My Reports', color: TYPE_META.mine.color },
];

const SHEET_TITLES = {
  All: 'All places',
  NGOs: 'Recycling centres',
  'Trash Dumps': 'Dump reports',
  'My Reports': 'Your reports',
};

const SHEET_MIN = 214; // visible height of the collapsed sheet
const FAB_SIZE = 46;

const typeOf = (m) => (m.isNgo ? 'centre' : m.isMyReport ? 'mine' : 'dump');

const distanceKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const formatKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

// Static Leaflet page. It is loaded once; markers, focus and layers are pushed in via JS calls
// so selecting a place pans the map instead of reloading it.
const buildMapHtml = (center) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #EEF2EF; }
    .leaflet-control-attribution { font-size: 9px; background: rgba(255,255,255,0.7) !important; }
    .pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
      border: 2.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center; transition: transform 0.15s; }
    .pin::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; }
    .pin.centre { background: #2E7D32; }
    .pin.dump { background: #DC2626; }
    .pin.mine { background: #D97706; }
    .pin.active { transform: rotate(-45deg) scale(1.35); }
    .me { width: 14px; height: 14px; border-radius: 50%; background: #2563EB; border: 3px solid #fff;
      box-shadow: 0 0 0 7px rgba(37,99,235,0.2); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function send(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      else if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*');
    }
    if (typeof L === 'undefined') {
      send({ type: 'MAP_ERROR' });
    } else {
      var map = L.map('map', { zoomControl: false }).setView([${center.latitude}, ${center.longitude}], 12);
      // Free tile sources that need no API key
      var layers = {
        street: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© OpenStreetMap contributors'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19, attribution: 'Tiles © Esri'
        })
      };
      var streetBackup = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, attribution: 'Tiles © Esri'
      });
      // If OpenStreetMap refuses tiles, switch the street layer to Esri
      var streetErrors = 0;
      layers.street.on('tileerror', function () {
        streetErrors += 1;
        if (streetErrors !== 3) return;
        var wasShowing = current === layers.street;
        if (wasShowing) map.removeLayer(layers.street);
        layers.street = streetBackup;
        if (wasShowing) current = streetBackup.addTo(map);
      });
      var current = layers.street.addTo(map);
      var markerLayer = L.layerGroup().addTo(map);
      var byId = {};
      var activeId = null;
      var meMarker = null;
      var offsetY = 0;

      function iconFor(m, active) {
        return L.divIcon({
          className: '',
          html: '<div class="pin ' + m.kind + (active ? ' active' : '') + '"></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 26]
        });
      }

      function flyWithOffset(lat, lng, zoom) {
        var p = map.project([lat, lng], zoom).add([0, offsetY]);
        map.flyTo(map.unproject(p, zoom), zoom, { duration: 0.6 });
      }

      window.setOffset = function (px) { offsetY = px; };

      window.setMarkers = function (list, fit) {
        markerLayer.clearLayers();
        byId = {};
        var pts = [];
        list.forEach(function (m) {
          if (!m.lat || !m.lng) return;
          var mk = L.marker([m.lat, m.lng], { icon: iconFor(m, m.id === activeId) });
          mk._data = m;
          mk.on('click', function () { send({ type: 'SELECT_MARKER', markerId: m.id }); });
          mk.addTo(markerLayer);
          byId[m.id] = mk;
          pts.push([m.lat, m.lng]);
        });
        if (fit && pts.length > 1) {
          map.fitBounds(pts, { paddingTopLeft: [40, 150], paddingBottomRight: [40, 40 + offsetY * 2] });
        } else if (fit && pts.length === 1) {
          flyWithOffset(pts[0][0], pts[0][1], 15);
        }
      };

      window.focusMarker = function (id, lat, lng) {
        if (activeId && byId[activeId]) byId[activeId].setIcon(iconFor(byId[activeId]._data, false));
        activeId = id;
        if (id && byId[id]) byId[id].setIcon(iconFor(byId[id]._data, true));
        if (lat && lng) flyWithOffset(lat, lng, Math.max(map.getZoom(), 15));
      };

      window.setLayer = function (name) {
        var next = layers[name] || layers.street;
        if (next === current) return;
        map.removeLayer(current);
        current = next.addTo(map);
      };

      window.showMe = function (lat, lng) {
        if (meMarker) meMarker.setLatLng([lat, lng]);
        else meMarker = L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
          zIndexOffset: 1000
        }).addTo(map);
        flyWithOffset(lat, lng, 15);
      };

      map.on('click', function () { send({ type: 'MAP_TAP' }); });
      send({ type: 'READY' });
    }
  </script>
</body>
</html>`;

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const tabBarHeightCtx = useContext(BottomTabBarHeightContext);
  const inTabs = tabBarHeightCtx !== undefined;
  const bottomOffset = inTabs ? tabBarHeightCtx : insets.bottom;

  const [reports, setReports] = useState([]);
  const [ngoCenters, setNgoCenters] = useState(DEFAULT_RECOVERY_HUBS);
  const [selectedFilter, setSelectedFilter] = useState('NGOs'); // 'NGOs' | 'My Reports' | 'Trash Dumps' | 'All'
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLayer, setMapLayer] = useState('street');
  const [showLayers, setShowLayers] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  const focusDumpId = route?.params?.focusDumpId;
  const focusLocation = route?.params?.focusLocation;

  // Live fetch hubs from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadHubs() {
      try {
        const hubs = await fetchRecoveryHubs();
        if (isMounted && hubs && hubs.length > 0) {
          setNgoCenters(hubs);
        }
      } catch (e) {
        console.warn('Error loading recycling centres in MapScreen:', e);
      }
    }
    loadHubs();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (route?.params?.filter) {
      setSelectedFilter(route.params.filter);
      setSelectedMarker(null);
    }
  }, [route?.params?.filter]);

  useEffect(() => {
    setReports(getReports());
    const unsubscribe = subscribeReports((updated) => {
      setReports(updated);
    });
    // Pick up reports other people have added since the map was last opened
    const unsubscribeFocus = navigation.addListener('focus', refreshReports);
    return () => {
      unsubscribe();
      unsubscribeFocus();
    };
  }, [navigation]);

  const allMarkers = useMemo(() => {
    const dumpMarkers = reports.map((r) => ({ ...r, type: 'dump', isDump: true }));
    const mine = dumpMarkers.filter((m) => m.isMyReport);
    return [...mine, ...ngoCenters, ...dumpMarkers.filter((m) => !m.isMyReport)];
  }, [reports, ngoCenters]);

  const allMarkersRef = useRef(allMarkers);
  allMarkersRef.current = allMarkers;

  // Focus a specific dump or centre when navigated here with params
  useEffect(() => {
    if (focusDumpId && reports.length > 0) {
      const found = reports.find((r) => r.id === focusDumpId);
      if (found) {
        setSelectedFilter('My Reports');
        setSelectedMarker({ ...found, isDump: true });
      }
    } else if (focusLocation) {
      setSelectedFilter('NGOs');
      const foundNgo =
        ngoCenters.find(
          (n) =>
            n.id === focusLocation.id ||
            n.rawId === focusLocation.id ||
            n.id === `ngo-${focusLocation.id}` ||
            (focusLocation.title && n.title?.toLowerCase() === focusLocation.title.toLowerCase())
        ) || { ...focusLocation, isNgo: true };
      setSelectedMarker(foundNgo);
    }
  }, [focusDumpId, focusLocation, reports, ngoCenters]);

  const filteredMarkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = allMarkers.filter((m) => {
      if (selectedFilter === 'My Reports' && !m.isMyReport) return false;
      if (selectedFilter === 'NGOs' && !m.isNgo) return false;
      if (selectedFilter === 'Trash Dumps' && !m.isDump) return false;
      if (!q) return true;
      return (
        (m.title || m.name || '').toLowerCase().includes(q) ||
        (m.address || m.fullAddress || '').toLowerCase().includes(q) ||
        (Array.isArray(m.streams) && m.streams.some((s) => s.toLowerCase().includes(q))) ||
        (m.wasteType || m.facilityType || '').toLowerCase().includes(q)
      );
    });
    if (userLocation) {
      return list
        .map((m) => ({ ...m, distance: distanceKm(userLocation, m) }))
        .sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [allMarkers, selectedFilter, searchQuery, userLocation]);

  // ---------- Map bridge ----------
  const callMap = useCallback((fn, ...args) => {
    if (Platform.OS === 'web') {
      const w = iframeRef.current?.contentWindow;
      if (w && typeof w[fn] === 'function') w[fn](...args);
    } else {
      const argStr = args.map((a) => JSON.stringify(a ?? null)).join(',');
      webViewRef.current?.injectJavaScript(`window.${fn} && window.${fn}(${argStr}); true;`);
    }
  }, []);

  const handleMapMessage = useCallback((data) => {
    if (!data?.type) return;
    if (data.type === 'READY') {
      setMapReady(true);
      setMapError(false);
    } else if (data.type === 'MAP_ERROR') {
      setMapError(true);
    } else if (data.type === 'SELECT_MARKER' && data.markerId) {
      const found = allMarkersRef.current.find((m) => m.id === data.markerId);
      if (found) setSelectedMarker(found);
    } else if (data.type === 'MAP_TAP') {
      setShowLayers(false);
    }
  }, []);

  // Web: the Leaflet iframe talks to us via postMessage
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const onMessage = (event) => handleMapMessage(event?.data);
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleMapMessage]);

  const onWebViewMessage = (event) => {
    try {
      handleMapMessage(JSON.parse(event.nativeEvent.data));
    } catch (e) {
      // ignore non-JSON messages
    }
  };

  // Loaded once so the map never reloads when state changes
  const initialCenter = useRef({ latitude: 19.1458, longitude: 72.937 }).current;
  const mapHtml = useMemo(() => buildMapHtml(initialCenter), [initialCenter]);
  const nativeSource = useMemo(() => ({ html: mapHtml, baseUrl: 'https://localhost/' }), [mapHtml]);

  // Keep pins centred in the visible area above the collapsed sheet
  const pinOffset = Math.round((SHEET_MIN + bottomOffset) / 2 - 60);
  useEffect(() => {
    if (mapReady) callMap('setOffset', pinOffset);
  }, [mapReady, pinOffset, callMap]);

  const markerPayload = useMemo(
    () =>
      filteredMarkers.map((m) => ({
        id: m.id,
        lat: m.latitude,
        lng: m.longitude,
        kind: typeOf(m),
      })),
    [filteredMarkers]
  );
  const payloadKey = useMemo(() => JSON.stringify(markerPayload), [markerPayload]);
  const lastFitFilter = useRef(null);

  useEffect(() => {
    if (!mapReady) return;
    const shouldFit = lastFitFilter.current !== selectedFilter && !selectedMarker;
    lastFitFilter.current = selectedFilter;
    callMap('setMarkers', markerPayload, shouldFit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, payloadKey]);

  useEffect(() => {
    if (!mapReady) return;
    if (selectedMarker) {
      callMap('focusMarker', selectedMarker.id, selectedMarker.latitude, selectedMarker.longitude);
    } else {
      callMap('focusMarker', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, selectedMarker?.id]);

  useEffect(() => {
    if (mapReady) callMap('setLayer', mapLayer);
  }, [mapReady, mapLayer, callMap]);

  // ---------- Bottom sheet ----------
  const sheetMax = Math.round(winH * 0.62);
  const collapsedY = sheetMax - SHEET_MIN;
  const sheetY = useRef(new Animated.Value(collapsedY)).current;
  const dragStart = useRef(collapsedY);

  const snapSheet = useCallback(
    (expand) => {
      setSheetExpanded(expand);
      Animated.spring(sheetY, {
        toValue: expand ? 0 : collapsedY,
        useNativeDriver: true,
        bounciness: 0,
        speed: 16,
      }).start();
    },
    [sheetY, collapsedY]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          sheetY.stopAnimation((v) => {
            dragStart.current = v;
          });
        },
        onPanResponderMove: (_, g) => {
          sheetY.setValue(Math.min(collapsedY, Math.max(0, dragStart.current + g.dy)));
        },
        onPanResponderRelease: (_, g) => {
          const pos = dragStart.current + g.dy;
          if (g.vy < -0.5) snapSheet(true);
          else if (g.vy > 0.5) snapSheet(false);
          else snapSheet(pos < collapsedY / 2);
        },
        onPanResponderTerminate: () => snapSheet(false),
      }),
    [sheetY, collapsedY, snapSheet]
  );

  // Selecting something collapses the sheet so the pin stays visible
  useEffect(() => {
    if (selectedMarker) snapSheet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarker?.id]);

  // ---------- Actions ----------
  const handleLocateMe = async () => {
    setShowLayers(false);
    setIsLocating(true);
    try {
      const coords = await getCurrentCoords();
      setUserLocation(coords);
      if (mapReady) callMap('showMe', coords.latitude, coords.longitude);
    } catch (err) {
      Alert.alert('Location unavailable', err.message || 'Could not get your location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleDirections = (lat, lon) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
  };

  const confirmDeleteReport = (report) => {
    showAlert('Delete this report?', 'It will be removed from the map for everyone. This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(report.id);
          try {
            await deleteReport(report);
            setSelectedMarker(null);
          } catch (err) {
            showAlert('Could not delete', err.message || 'Please try again.');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleFilterPress = (key) => {
    setSelectedFilter(key);
    setSelectedMarker(null);
    setShowLayers(false);
  };

  const retryMap = () => {
    setMapError(false);
    setMapReady(false);
    if (Platform.OS === 'web') {
      if (iframeRef.current) iframeRef.current.srcdoc = mapHtml;
    } else {
      webViewRef.current?.reload();
    }
  };

  const controlsBottom = bottomOffset + SHEET_MIN + spacing.md;

  // ---------- Render helpers ----------
  const renderListItem = (m, idx) => {
    const meta = TYPE_META[typeOf(m)];
    const isLast = idx === filteredMarkers.length - 1;
    return (
      <TouchableOpacity
        key={m.id}
        style={[styles.listItem, !isLast && styles.listItemDivider]}
        onPress={() => setSelectedMarker(m)}
        activeOpacity={0.7}
      >
        <View style={[styles.listIcon, { backgroundColor: meta.tint }]}>
          <Ionicons name={meta.icon} size={17} color={meta.color} />
        </View>
        <View style={styles.listTextCol}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {m.title || m.name}
          </Text>
          <Text style={styles.listSub} numberOfLines={1}>
            {m.address}
          </Text>
        </View>
        {m.distance != null ? <Text style={styles.listDistance}>{formatKm(m.distance)}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <Ionicons
        name={selectedFilter === 'My Reports' ? 'document-text-outline' : 'search-outline'}
        size={26}
        color={colors.placeholder}
      />
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'No places match your search'
          : selectedFilter === 'My Reports'
          ? "You haven't reported any dumps yet"
          : 'Nothing here yet'}
      </Text>
      {selectedFilter === 'My Reports' && !searchQuery ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('ReportDumpScreen')}>
          <Text style={styles.emptyBtnText}>Report a dump</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderSelected = (m) => {
    const meta = TYPE_META[typeOf(m)];
    const dist = userLocation ? distanceKm(userLocation, m) : null;
    return (
      <>
        <View style={styles.selHeaderRow}>
          <View style={[styles.typePill, { backgroundColor: meta.tint }]}>
            <Ionicons name={meta.icon} size={11} color={meta.color} style={{ marginRight: 4 }} />
            <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedMarker(null)}
            style={styles.selCloseBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.selTitle} numberOfLines={2}>
          {m.title || m.name}
        </Text>
        <Text style={styles.selAddress} numberOfLines={sheetExpanded ? undefined : 1}>
          {m.fullAddress || m.address}
        </Text>
        <Text style={styles.selMeta} numberOfLines={1}>
          {[dist != null ? formatKm(dist) + ' away' : null, m.isNgo ? m.timings : m.date]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>

        <View style={styles.selActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleDirections(m.latitude, m.longitude)}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={15} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Directions</Text>
          </TouchableOpacity>
          {m.phone ? (
            <TouchableOpacity style={styles.outlineBtn} onPress={() => Linking.openURL(`tel:${m.phone}`)}>
              <Ionicons name="call-outline" size={15} color={colors.primary800} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.outlineBtn} onPress={() => snapSheet(!sheetExpanded)}>
            <Ionicons
              name={sheetExpanded ? 'chevron-down' : 'information-circle-outline'}
              size={16}
              color={colors.primary800}
            />
          </TouchableOpacity>
          {m.isMyReport ? (
            <TouchableOpacity
              style={[styles.outlineBtn, styles.deleteBtn]}
              onPress={() => confirmDeleteReport(m)}
              disabled={deletingId === m.id}
              accessibilityLabel="Delete report"
            >
              {deletingId === m.id ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Full details, revealed when the sheet is swiped up */}
        <View style={styles.detailBlock}>
          {m.photoUri ? (
            <Image source={{ uri: m.photoUri }} style={styles.detailPhoto} resizeMode="cover" resizeMethod="resize" />
          ) : null}

          {m.isNgo && Array.isArray(m.streams) && m.streams.length > 0 ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Accepts</Text>
              <View style={styles.chipWrap}>
                {m.streams.map((st, idx) => (
                  <View key={idx} style={styles.streamChip}>
                    <Text style={styles.streamChipText}>{st}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {!m.isNgo && (m.severity || m.status) ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: m.statusColor || colors.textPrimary }]}>
                {[m.status, m.severity].filter(Boolean).join('  ·  ')}
              </Text>
            </View>
          ) : null}

          {m.guidelines || m.notes ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>{m.isNgo ? 'Drop-off guidelines' : 'Notes'}</Text>
              <Text style={styles.detailValue}>{m.guidelines || m.notes}</Text>
            </View>
          ) : null}

          {m.authority ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Assigned authority</Text>
              <Text style={styles.detailValue}>{m.authority}</Text>
            </View>
          ) : null}

          {m.isNgo ? (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('NgoTab', { focusHubId: m.id })}
            >
              <Text style={styles.linkRowText}>Open in Recycling Centres</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primary700} />
            </TouchableOpacity>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.maxContainer}>
        {/* Map fills the whole screen */}
        <View style={StyleSheet.absoluteFill}>
          {Platform.OS === 'web' ? (
            <iframe
              ref={iframeRef}
              title="Recycling centres and dump reports map"
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              style={styles.map}
              originWhitelist={['*']}
              source={nativeSource}
              onMessage={onWebViewMessage}
              onError={() => setMapError(true)}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
            />
          )}

          {!mapReady || mapError ? (
            <View style={styles.mapOverlay}>
              {mapError ? (
                <>
                  <Ionicons name="cloud-offline-outline" size={28} color={colors.textSecondary} />
                  <Text style={styles.mapOverlayText}>Map couldn't load. Check your internet.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={retryMap}>
                    <Text style={styles.emptyBtnText}>Try again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <ActivityIndicator size="small" color={colors.primary600} />
              )}
            </View>
          ) : null}
        </View>

        {/* Floating search + filters */}
        <View style={[styles.topOverlay, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
          <View style={styles.searchCard}>
            {!inTabs && navigation.canGoBack() ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.searchLeadBtn}
              >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchLeadIcon} />
            )}
            <TextInput
              placeholder="Search centres, dumps or materials"
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={colors.placeholder} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {FILTERS.map((f) => {
              const active = selectedFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => handleFilterPress(f.key)}
                  activeOpacity={0.8}
                >
                  {f.color ? (
                    <View style={[styles.filterDot, { backgroundColor: active ? colors.white : f.color }]} />
                  ) : null}
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Floating map controls */}
        <TouchableOpacity
          style={[styles.reportFab, { bottom: controlsBottom }]}
          onPress={() => navigation.navigate('ReportDumpScreen')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.reportFabText}>Report dump</Text>
        </TouchableOpacity>

        <View style={[styles.controlsCol, { bottom: controlsBottom }]}>
          <TouchableOpacity
            style={[styles.roundBtn, showLayers && styles.roundBtnActive]}
            onPress={() => setShowLayers((v) => !v)}
          >
            <Ionicons name="layers-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} onPress={handleLocateMe} disabled={isLocating}>
            {isLocating ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Ionicons name={userLocation ? 'locate' : 'locate-outline'} size={20} color={userLocation ? '#2563EB' : colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {showLayers ? (
          <View style={[styles.layersCard, { bottom: controlsBottom + FAB_SIZE + spacing.sm }]}>
            {[
              { key: 'street', label: 'Map', icon: 'map-outline' },
              { key: 'satellite', label: 'Satellite', icon: 'earth-outline' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.layerRow}
                onPress={() => {
                  setMapLayer(opt.key);
                  setShowLayers(false);
                }}
              >
                <Ionicons name={opt.icon} size={17} color={colors.textPrimary} style={{ marginRight: 10 }} />
                <Text style={styles.layerRowText}>{opt.label}</Text>
                {mapLayer === opt.key ? <Ionicons name="checkmark" size={17} color={colors.primary600} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Swipe-up sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetMax, bottom: bottomOffset, transform: [{ translateY: sheetY }] },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={1} onPress={() => snapSheet(!sheetExpanded)} style={styles.handleHit}>
              <View style={styles.handle} />
            </TouchableOpacity>

            {!selectedMarker ? (
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{SHEET_TITLES[selectedFilter]}</Text>
                <Text style={styles.sheetSub}>
                  {filteredMarkers.length} {filteredMarkers.length === 1 ? 'place' : 'places'}
                  {userLocation ? '  ·  nearest first' : ''}
                </Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            scrollEnabled={sheetExpanded}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {selectedMarker
              ? renderSelected(selectedMarker)
              : filteredMarkers.length === 0
              ? renderEmpty()
              : filteredMarkers.map(renderListItem)}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: Platform.OS === 'web' ? '#f3f6f3' : '#EEF2EF' },
  maxContainer: { flex: 1, width: '100%', maxWidth: 600, overflow: 'hidden', backgroundColor: '#EEF2EF' },
  map: { flex: 1, backgroundColor: '#EEF2EF' },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF2EF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  mapOverlayText: { marginTop: spacing.sm, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // Top overlay
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  searchCard: {
    ...shadow,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginHorizontal: spacing.base,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radius.full,
  },
  searchLeadIcon: { marginRight: 10 },
  searchLeadBtn: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  chipRow: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  filterChip: {
    ...shadow,
    shadowOpacity: 0.08,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  filterChipActive: { backgroundColor: colors.primary800 },
  filterDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  filterChipTextActive: { color: colors.white },

  // Floating controls
  controlsCol: { position: 'absolute', right: spacing.base, gap: spacing.sm },
  roundBtn: {
    ...shadow,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundBtnActive: { backgroundColor: colors.primary50 },
  reportFab: {
    ...shadow,
    position: 'absolute',
    left: spacing.base,
    height: FAB_SIZE,
    paddingHorizontal: 18,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary800,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportFabText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  layersCard: {
    ...shadow,
    position: 'absolute',
    right: spacing.base,
    width: 170,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  layerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  layerRowText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },

  // Sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleHit: { alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#D5DBD7' },
  sheetHeader: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  sheetSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },

  // List
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  listItemDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  listIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  listTextCol: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listDistance: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  emptyBox: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyTitle: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary800,
  },
  emptyBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  // Selected place
  selHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
  typePillText: { fontSize: 11, fontWeight: '700' },
  selCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  selTitle: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm, textTransform: 'capitalize' },
  selAddress: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  selMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  selActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  detailBlock: { marginTop: spacing.lg },
  detailPhoto: { width: '100%', height: 160, borderRadius: radius.lg, marginBottom: spacing.base },
  detailSection: { marginBottom: spacing.base },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  detailValue: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  streamChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.primary50 },
  streamChipText: { fontSize: 12, color: colors.primary800, fontWeight: '600', textTransform: 'capitalize' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linkRowText: { fontSize: 14, fontWeight: '600', color: colors.primary700 },
});
