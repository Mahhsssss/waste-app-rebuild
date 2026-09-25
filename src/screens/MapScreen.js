import React, { useState, useEffect } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { colors, spacing, radius } from '../globalStyles';
import { getReports, subscribeReports } from '../services/reportService';
import { DEFAULT_RECOVERY_HUBS, fetchRecoveryHubs } from '../services/hubService';

export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('NGOs'); // 'NGOs' | 'My Reports' | 'Trash Dumps' | 'All'
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [detailsModalItem, setDetailsModalItem] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapMode, setMapMode] = useState('pins'); // 'pins' = Multi-Pin Overview, 'm' = Street, 'k' = Satellite
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // All 15 verified Recovery Hubs from Supabase markers table
  const [ngoCenters, setNgoCenters] = useState(DEFAULT_RECOVERY_HUBS);

  // Central coordinates (Default to Greenciti Bhandup West hub)
  const [activeLocation, setActiveLocation] = useState({
    latitude: 19.1458,
    longitude: 72.937,
    title: 'Greenciti Recovery Hub',
  });

  // Navigation params: focus on specific dump or NGO
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
        console.warn('Error loading recovery hubs in MapScreen:', e);
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
    }
  }, [route?.params?.filter]);

  useEffect(() => {
    setReports(getReports());
    const unsubscribe = subscribeReports((updated) => {
      setReports(updated);
    });
    return () => unsubscribe();
  }, []);

  // Format reported dumps
  const dumpMarkers = reports.map((r) => ({
    ...r,
    type: 'dump',
    color: r.severityLevel === 'critical' ? '#DC2626' : '#EA580C',
    icon: 'warning',
    isDump: true,
  }));

  const myReports = dumpMarkers.filter((m) => m.isMyReport);
  const allMarkers = [...myReports, ...ngoCenters, ...dumpMarkers.filter((m) => !m.isMyReport)];

  // Route param handler & initial marker selection
  useEffect(() => {
    if (focusDumpId && reports.length > 0) {
      const found = reports.find((r) => r.id === focusDumpId);
      if (found) {
        setSelectedFilter('My Reports');
        setSelectedMarker({ ...found, isDump: true });
        setActiveLocation({
          latitude: found.latitude,
          longitude: found.longitude,
          title: found.title,
        });
      }
    } else if (focusLocation) {
      setSelectedFilter('NGOs');
      const foundNgo = ngoCenters.find(
        (n) =>
          n.id === focusLocation.id ||
          n.rawId === focusLocation.id ||
          n.id === `ngo-${focusLocation.id}` ||
          (focusLocation.title && n.title?.toLowerCase() === focusLocation.title.toLowerCase())
      ) || focusLocation;
      setSelectedMarker(foundNgo);
      setActiveLocation({
        latitude: focusLocation.latitude || foundNgo.latitude,
        longitude: focusLocation.longitude || foundNgo.longitude,
        title: focusLocation.title || foundNgo.title || 'Recovery Hub',
      });
    } else if (!selectedMarker) {
      if (ngoCenters.length > 0) {
        setSelectedMarker(ngoCenters[0]);
        setActiveLocation({
          latitude: ngoCenters[0].latitude,
          longitude: ngoCenters[0].longitude,
          title: ngoCenters[0].title,
        });
      } else if (myReports.length > 0) {
        setSelectedMarker(myReports[0]);
        setActiveLocation({
          latitude: myReports[0].latitude,
          longitude: myReports[0].longitude,
          title: myReports[0].title,
        });
      }
    }
  }, [focusDumpId, focusLocation, reports, ngoCenters]);

  // PostMessage listener for Web Leaflet multi-pin clicks
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event) => {
        if (event?.data?.type === 'SELECT_MARKER' && event.data.markerId) {
          const found = allMarkers.find((m) => m.id === event.data.markerId);
          if (found) {
            handleSelectMarker(found);
          }
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [allMarkers]);

  const filteredMarkers = allMarkers.filter((m) => {
    // Primary tab filtering
    let matchesCategory = true;
    if (selectedFilter === 'My Reports') matchesCategory = m.isMyReport;
    else if (selectedFilter === 'NGOs') matchesCategory = m.isNgo;
    else if (selectedFilter === 'Trash Dumps') matchesCategory = m.isDump;

    if (!matchesCategory) return false;

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (m.title || m.name || '').toLowerCase().includes(q);
      const addressMatch = (m.address || m.fullAddress || '').toLowerCase().includes(q);
      const streamsMatch = Array.isArray(m.streams) && m.streams.some((s) => s.toLowerCase().includes(q));
      const typeMatch = (m.wasteType || m.facilityType || '').toLowerCase().includes(q);
      return titleMatch || addressMatch || streamsMatch || typeMatch;
    }

    return true;
  });


  // Real Hardware GPS Location Detector
  const handleLocateMe = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setIsLocating(false);
          setActiveLocation({
            latitude,
            longitude,
            title: 'My Current Location',
          });
          setSelectedMarker({
            id: 'my-gps-location',
            title: 'Your Current Device Location',
            address: `GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`,
            latitude,
            longitude,
            status: 'Device GPS Centered',
            statusColor: '#166534',
            notes: 'You are currently here. You can report dumps or locate nearby recovery centers relative to your coordinates.',
            isGps: true,
          });
          Alert.alert('GPS Located', `Google Maps centered on your coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (err) => {
          setIsLocating(false);
          Alert.alert('GPS Notice', 'Unable to retrieve precise hardware coordinates. Please enable device location permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      Alert.alert('Not Supported', 'Geolocation is not available on this device.');
    }
  };

  // Turn-by-Turn Navigation via Google Maps App / Web
  const handleDirections = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };

  // Select a marker and recenter Google Maps
  const handleSelectMarker = (marker) => {
    setSelectedMarker(marker);
    setActiveLocation({
      latitude: marker.latitude,
      longitude: marker.longitude,
      title: marker.title,
    });
  };

  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}&z=${zoomLevel}&t=${mapMode}&output=embed`;

  const generateLeafletHtml = () => {
    const markersJson = JSON.stringify(
      filteredMarkers.map((m) => ({
        id: m.id,
        title: m.title || m.name || 'Location',
        address: m.address || '',
        lat: m.latitude,
        lng: m.longitude,
        isNgo: !!m.isNgo,
        isMyReport: !!m.isMyReport,
        streams: m.streams || [],
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .hub-pin {
      background: #166534;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    }
    .dump-pin {
      background: #DC2626;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    }
    .user-pin {
      background: #D97706;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.18);
    }
    .popup-content { padding: 4px; max-width: 220px; }
    .popup-title { font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 3px; }
    .popup-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 999px;
      margin-bottom: 5px;
    }
    .badge-ngo { background: #DCFCE7; color: #166534; }
    .badge-dump { background: #FEE2E2; color: #DC2626; }
    .badge-user { background: #FEF3C7; color: #B45309; }
    .popup-addr { font-size: 11px; color: #4B5563; line-height: 1.3; margin-bottom: 6px; }
    .popup-streams { font-size: 10px; color: #065F46; font-weight: 600; margin-bottom: 6px; }
    .popup-btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      background: #166534;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 8px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const centerLat = ${activeLocation.latitude};
    const centerLng = ${activeLocation.longitude};
    const zoom = ${zoomLevel};

    const map = L.map('map', { zoomControl: false }).setView([centerLat, centerLng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const latLngs = [];

    markers.forEach(m => {
      if (!m.lat || !m.lng) return;
      latLngs.push([m.lat, m.lng]);

      const pinClass = m.isNgo ? 'hub-pin' : m.isMyReport ? 'user-pin' : 'dump-pin';
      const pinIcon = m.isNgo ? '🏢' : m.isMyReport ? '🌟' : '🚨';

      const customIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: '<div class="' + pinClass + '">' + pinIcon + '</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      const badgeClass = m.isNgo ? 'badge-ngo' : m.isMyReport ? 'badge-user' : 'badge-dump';
      const badgeText = m.isNgo ? 'RECOVERY HUB' : m.isMyReport ? 'YOUR REPORT' : 'DUMP REPORT';

      const streamsHtml = (m.streams && m.streams.length > 0)
        ? '<div class="popup-streams">Accepts: ' + m.streams.slice(0, 3).join(', ') + (m.streams.length > 3 ? ' +' + (m.streams.length - 3) + ' more' : '') + '</div>'
        : '';

      const popupHtml = '<div class="popup-content">' +
        '<div class="popup-title">' + m.title + '</div>' +
        '<div class="popup-badge ' + badgeClass + '">' + badgeText + '</div>' +
        '<div class="popup-addr">' + (m.address || '') + '</div>' +
        streamsHtml +
        '<button class="popup-btn" onclick="selectMarker(\\'' + m.id + '\\')">Select & View Details</button>' +
        '</div>';

      const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        selectMarker(m.id);
      });
    });

    function selectMarker(id) {
      if (window.parent) {
        window.parent.postMessage({ type: 'SELECT_MARKER', markerId: id }, '*');
      }
    }

    if (latLngs.length > 1 && ${selectedFilter === 'All' ? 'true' : 'false'}) {
      map.fitBounds(latLngs, { padding: [30, 30] });
    }
  </script>
</body>
</html>`;
  };

  return (
    <SafeAreaView style={[globalStyles.safeArea, styles.safeAreaOverride]} edges={['top', 'left', 'right']}>
      <View style={styles.webWrapper}>
        <View style={styles.maxContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeftRow}>
              <TouchableOpacity
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('HomeTab');
                  }
                }}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.primary800} />
              </TouchableOpacity>
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.headerTitle}>Waste & Hub Map</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>Real-time Google Maps locator for reported dumps and recovery hubs</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addReportBtn}
              onPress={() => navigation.navigate('ReportDumpScreen')}
            >
              <Ionicons name="add" size={16} color={colors.white} style={{ marginRight: 4 }} />
              <Text style={styles.addReportBtnText}>Report Dump</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar for 15+ Hubs & Dumps */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={17} color={colors.primary600} style={styles.searchIcon} />
            <TextInput
              placeholder="Search 15+ hubs, dumps, streams (plastic, Goregaon)..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                <Ionicons name="close-circle" size={18} color={colors.primary600} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Primary Quick-Filter Tabs */}
          <View style={styles.primaryTabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.primaryTabScroll}>
              <TouchableOpacity
                style={[styles.primaryTab, selectedFilter === 'NGOs' && styles.primaryTabActiveNgo]}
                onPress={() => {
                  setSelectedFilter('NGOs');
                  if (ngoCenters.length > 0) handleSelectMarker(ngoCenters[0]);
                }}
              >
                <Ionicons
                  name="business"
                  size={14}
                  color={selectedFilter === 'NGOs' ? colors.white : '#166534'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.primaryTabText, selectedFilter === 'NGOs' && styles.primaryTabTextActive]}>
                  🏢 NGOs ({ngoCenters.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryTab, selectedFilter === 'My Reports' && styles.primaryTabActiveUser]}
                onPress={() => {
                  setSelectedFilter('My Reports');
                  if (myReports.length > 0) handleSelectMarker(myReports[0]);
                }}
              >
                <Ionicons
                  name="person"
                  size={14}
                  color={selectedFilter === 'My Reports' ? colors.white : colors.primary800}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.primaryTabText, selectedFilter === 'My Reports' && styles.primaryTabTextActive]}>
                  🌟 Reported by Me ({myReports.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryTab, selectedFilter === 'Trash Dumps' && styles.primaryTabActiveDump]}
                onPress={() => {
                  setSelectedFilter('Trash Dumps');
                  if (dumpMarkers.length > 0) handleSelectMarker(dumpMarkers[0]);
                }}
              >
                <Ionicons
                  name="warning"
                  size={14}
                  color={selectedFilter === 'Trash Dumps' ? colors.white : '#DC2626'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.primaryTabText, selectedFilter === 'Trash Dumps' && styles.primaryTabTextActive]}>
                  🚨 All Dumps ({dumpMarkers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryTab, selectedFilter === 'All' && styles.primaryTabActiveAll]}
                onPress={() => setSelectedFilter('All')}
              >
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color={selectedFilter === 'All' ? colors.white : colors.primary800}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.primaryTabText, selectedFilter === 'All' && styles.primaryTabTextActive]}>
                  All Locations ({allMarkers.length})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Map Toolbar: All Pins / Street / Satellite, GPS, and Zoom */}
          <View style={styles.toolbar}>
            {/* View Mode Toggle */}
            <View style={styles.modeToggleGroup}>
              <TouchableOpacity
                style={[styles.modeBtn, mapMode === 'pins' && styles.modeBtnActive]}
                onPress={() => setMapMode('pins')}
              >
                <Ionicons
                  name="pin"
                  size={13}
                  color={mapMode === 'pins' ? colors.white : colors.primary800}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.modeBtnText, mapMode === 'pins' && styles.modeBtnTextActive]}>
                  All Pins
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, mapMode === 'm' && styles.modeBtnActive]}
                onPress={() => setMapMode('m')}
              >
                <Ionicons
                  name="map-outline"
                  size={13}
                  color={mapMode === 'm' ? colors.white : colors.primary800}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.modeBtnText, mapMode === 'm' && styles.modeBtnTextActive]}>
                  Street
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, mapMode === 'k' && styles.modeBtnActive]}
                onPress={() => setMapMode('k')}
              >
                <Ionicons
                  name="planet-outline"
                  size={13}
                  color={mapMode === 'k' ? colors.white : colors.primary800}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.modeBtnText, mapMode === 'k' && styles.modeBtnTextActive]}>
                  Satellite
                </Text>
              </TouchableOpacity>
            </View>

            {/* GPS Locator */}
            <TouchableOpacity
              style={[styles.gpsBtn, isLocating && styles.gpsBtnLoading]}
              onPress={handleLocateMe}
              disabled={isLocating}
            >
              <Ionicons
                name={isLocating ? 'sync-outline' : 'navigate'}
                size={13}
                color={colors.primary800}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.gpsBtnText}>
                {isLocating ? 'Locating...' : 'Locate Me'}
              </Text>
            </TouchableOpacity>

            {/* Zoom Controls */}
            <View style={styles.zoomGroup}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel((z) => Math.min(19, z + 1))}
              >
                <Ionicons name="add" size={15} color={colors.primary800} />
              </TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel((z) => Math.max(12, z - 1))}
              >
                <Ionicons name="remove" size={15} color={colors.primary800} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive Multi-Pin Map / Google Maps Embed Container */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              mapMode === 'pins' ? (
                <iframe
                  title="Interactive Multi-Pin Community Waste & Hub Map"
                  srcDoc={generateLeafletHtml()}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  loading="lazy"
                />
              ) : (
                <iframe
                  title="Google Maps Waste & Hub Locator"
                  src={googleMapsEmbedUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  loading="lazy"
                  allowFullScreen
                />
              )
            ) : (
              <View style={styles.nativeMapPlaceholder}>
                <Ionicons name="map" size={48} color={colors.primary800} />
                <Text style={styles.nativeMapText}>{activeLocation.title}</Text>
                <Text style={styles.nativeMapSub}>
                  Lat: {activeLocation.latitude.toFixed(4)}, Lon: {activeLocation.longitude.toFixed(4)}
                </Text>
                <TouchableOpacity
                  style={styles.openGoogleMapsBtn}
                  onPress={() => handleDirections(activeLocation.latitude, activeLocation.longitude)}
                >
                  <Ionicons name="open-outline" size={16} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.openGoogleMapsBtnText}>Open in Google Maps App</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Active Pin Overlay Tag */}
            <View style={styles.activeLocationBadge}>
              <Ionicons
                name={selectedMarker?.isNgo ? 'business' : selectedMarker?.isMyReport ? 'person' : 'location'}
                size={14}
                color={selectedMarker?.isNgo ? '#166534' : selectedMarker?.isMyReport ? '#B45309' : '#DC2626'}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.activeLocationText} numberOfLines={1}>
                {activeLocation.title} ({activeLocation.latitude.toFixed(3)}, {activeLocation.longitude.toFixed(3)})
              </Text>
            </View>
          </View>

          {/* Filtered Location Quick-Pills Bar */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {filteredMarkers.map((marker) => {
                const isSelected = selectedMarker?.id === marker.id;
                return (
                  <TouchableOpacity
                    key={marker.id}
                    style={[
                      styles.locationPill,
                      marker.isMyReport && styles.locationPillMyReport,
                      marker.isNgo && styles.locationPillNgo,
                      marker.isDump && !marker.isMyReport && styles.locationPillDump,
                      isSelected && styles.locationPillActive,
                    ]}
                    onPress={() => handleSelectMarker(marker)}
                  >
                    <Ionicons
                      name={marker.isNgo ? 'business' : marker.isMyReport ? 'person' : 'warning'}
                      size={13}
                      color={
                        isSelected
                          ? colors.white
                          : marker.isNgo
                          ? '#166534'
                          : marker.isMyReport
                          ? '#B45309'
                          : '#DC2626'
                      }
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.locationPillText,
                        isSelected && styles.locationPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {marker.shortName || marker.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Bottom Area: Detail Cards & Lists */}
          <ScrollView
            style={styles.bottomArea}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 85, 110) }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. SELECTED MARKER DETAIL CARD */}
            {selectedMarker ? (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tagRow}>
                      <View
                        style={[
                          styles.markerTypeBadge,
                          {
                            backgroundColor: selectedMarker.isNgo
                              ? '#166534'
                              : selectedMarker.isMyReport
                              ? '#FEF3C7'
                              : selectedMarker.isGps
                              ? '#E0F2FE'
                              : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.markerTypeBadgeText,
                            {
                              color: selectedMarker.isNgo
                                ? '#ffffff'
                                : selectedMarker.isMyReport
                                ? '#B45309'
                                : selectedMarker.isGps
                                ? '#0369A1'
                                : '#DC2626',
                            },
                          ]}
                        >
                          {selectedMarker.isNgo
                            ? 'NGO'
                            : selectedMarker.isMyReport
                            ? 'REPORTED BY YOU'
                            : selectedMarker.isGps
                            ? 'CURRENT LOCATION'
                            : 'COMMUNITY REPORT'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.markerTitle}>{selectedMarker.title}</Text>
                    <Text style={styles.markerAddress}>{selectedMarker.address}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedMarker(null)} style={styles.closeCalloutBtn}>
                    <Ionicons name="close" size={20} color={colors.primary600} />
                  </TouchableOpacity>
                </View>

                {/* Accepted Streams for NGOs */}
                {selectedMarker.isNgo && selectedMarker.streams && (
                  <View style={styles.ngoStreamsBox}>
                    <Text style={styles.ngoStreamsTitle}>Accepted Streams:</Text>
                    <View style={styles.ngoStreamPills}>
                      {selectedMarker.streams.map((st, idx) => (
                        <View key={idx} style={styles.ngoStreamChip}>
                          <Text style={styles.ngoStreamChipText}>{st}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Photo Evidence (for dumps) */}
                {selectedMarker.photoUri && (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: selectedMarker.photoUri }}
                      style={styles.detailPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>Photo Proof</Text>
                    </View>
                  </View>
                )}

                {/* Citizen observation notes (only if provided by user) */}
                {selectedMarker.notes && !selectedMarker.isNgo ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Observation Notes:</Text>
                    <Text style={styles.notesText}>{selectedMarker.notes}</Text>
                  </View>
                ) : null}

                {/* Detail Card Action Footer */}
                <View style={styles.detailFooter}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <Text style={[styles.statusVal, { color: selectedMarker.statusColor || '#166534' }]}>
                      {selectedMarker.status}
                    </Text>
                  </View>

                  <View style={styles.detailActionButtons}>
                    <TouchableOpacity
                      style={styles.directionsBtn}
                      onPress={() => handleDirections(selectedMarker.latitude, selectedMarker.longitude)}
                    >
                      <Ionicons name="navigate" size={13} color={colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.directionsBtnText}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ngoDirLinkBtn}
                      onPress={() => setDetailsModalItem(selectedMarker)}
                    >
                      <Ionicons name="information-circle-outline" size={14} color={colors.primary800} style={{ marginRight: 4 }} />
                      <Text style={styles.ngoDirLinkBtnText}>Show Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            {/* 2. DEDICATED "REPORTED BY ME" LIST VIEW */}
            {(selectedFilter === 'My Reports' || selectedFilter === 'All') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.sectionHeading}>Dumps Reported by You</Text>
                  </View>
                  <View style={styles.sectionCountBadge}>
                    <Text style={styles.sectionCountText}>{myReports.length} Dumps</Text>
                  </View>
                </View>

                {myReports.length === 0 ? (
                  <View style={styles.emptyPrompt}>
                    <Ionicons name="document-text-outline" size={30} color={colors.primary800} />
                    <Text style={styles.emptyPromptTitle}>No Dumps Reported by You</Text>
                    <Text style={styles.emptyPromptSub}>
                      Notice uncollected garbage in your area? Upload a photo to alert municipal authorities.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyReportBtn}
                      onPress={() => navigation.navigate('ReportDumpScreen')}
                    >
                      <Ionicons name="add-circle" size={16} color={colors.white} style={{ marginRight: 6 }} />
                      <Text style={styles.emptyReportBtnText}>Report a Trash Dump</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myReports.map((dump) => (
                    <View key={dump.id} style={styles.myDumpCard}>
                      <View style={styles.myDumpTopRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <View style={styles.myDumpBadgeRow}>
                            <View style={[styles.statusPill, { backgroundColor: (dump.statusColor || '#DC2626') + '20' }]}>
                              <View style={[styles.statusDot, { backgroundColor: dump.statusColor || '#DC2626' }]} />
                              <Text style={[styles.statusPillText, { color: dump.statusColor || '#DC2626' }]}>
                                {dump.status}
                              </Text>
                            </View>
                            <Text style={styles.myDumpTime}>{dump.date}</Text>
                          </View>
                          <Text style={styles.myDumpTitle}>{dump.title}</Text>
                          <Text style={styles.myDumpAddress} numberOfLines={2}>{dump.address}</Text>
                        </View>
                        {dump.photoUri && (
                          <Image source={{ uri: dump.photoUri }} style={styles.myDumpThumb} />
                        )}
                      </View>

                      {dump.notes ? (
                        <Text style={styles.myDumpNotes} numberOfLines={2}>
                          "{dump.notes}"
                        </Text>
                      ) : null}

                      <View style={styles.myDumpActions}>
                        <TouchableOpacity
                          style={styles.myDumpMapBtn}
                          onPress={() => handleSelectMarker(dump)}
                        >
                          <Ionicons name="locate" size={13} color={colors.primary800} style={{ marginRight: 4 }} />
                          <Text style={styles.myDumpMapBtnText}>Center on Map</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.ngoDirLinkBtn}
                          onPress={() => setDetailsModalItem(dump)}
                        >
                          <Ionicons name="document-text-outline" size={13} color={colors.primary800} style={{ marginRight: 4 }} />
                          <Text style={styles.ngoDirLinkBtnText}>Show Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.myDumpDirBtn}
                          onPress={() => handleDirections(dump.latitude, dump.longitude)}
                        >
                          <Ionicons name="navigate" size={13} color={colors.white} style={{ marginRight: 4 }} />
                          <Text style={styles.myDumpDirBtnText}>Directions</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 3. DEDICATED "NGOS" LIST VIEW */}
            {(selectedFilter === 'NGOs' || selectedFilter === 'All') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="business" size={16} color="#166534" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionHeading}>Recovery Hubs (NGOs)</Text>
                  </View>
                  <View style={[styles.sectionCountBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.sectionCountText, { color: '#166534' }]}>{ngoCenters.length} Hubs</Text>
                  </View>
                </View>

                {ngoCenters.map((ngo) => (
                  <View key={ngo.id} style={styles.ngoCard}>
                    <View style={styles.ngoCardHeader}>
                      <Text style={styles.ngoName}>{ngo.title}</Text>
                      <View style={styles.ngoBadge}>
                        <Text style={styles.ngoBadgeText}>{ngo.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.ngoAddress}>{ngo.address}</Text>

                    <Text style={styles.ngoStreamsSub}>Accepted Streams:</Text>
                    <View style={styles.ngoStreamPills}>
                      {ngo.streams.map((st, idx) => (
                        <View key={idx} style={styles.streamPill}>
                          <Text style={styles.streamPillText}>{st}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.ngoCardActions}>
                      <TouchableOpacity
                        style={styles.myDumpMapBtn}
                        onPress={() => handleSelectMarker(ngo)}
                      >
                        <Ionicons name="locate" size={13} color={colors.primary800} style={{ marginRight: 4 }} />
                        <Text style={styles.myDumpMapBtnText}>Center on Map</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ngoDirLinkBtn}
                        onPress={() => setDetailsModalItem(ngo)}
                      >
                        <Ionicons name="information-circle-outline" size={14} color={colors.primary800} style={{ marginRight: 4 }} />
                        <Text style={styles.ngoDirLinkBtnText}>Show Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.myDumpDirBtn}
                        onPress={() => handleDirections(ngo.latitude, ngo.longitude)}
                      >
                        <Ionicons name="navigate" size={13} color={colors.white} style={{ marginRight: 4 }} />
                        <Text style={styles.myDumpDirBtnText}>Directions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Extra bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* SHOW DETAILS MODAL SHEET */}
      {detailsModalItem && (
        <Modal visible={!!detailsModalItem} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
              {/* Native Bottom Sheet Drag Handle */}
              <View style={styles.modalDragHandle} />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <View
                      style={[
                        styles.markerTypeBadge,
                        {
                          backgroundColor: detailsModalItem.isNgo
                            ? '#166534'
                            : detailsModalItem.isMyReport
                            ? '#FEF3C7'
                            : '#FEE2E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.markerTypeBadgeText,
                          {
                            color: detailsModalItem.isNgo
                              ? '#ffffff'
                              : detailsModalItem.isMyReport
                              ? '#B45309'
                              : '#DC2626',
                          },
                        ]}
                      >
                        {detailsModalItem.isNgo
                          ? 'NGO RECOVERY HUB'
                          : detailsModalItem.isMyReport
                          ? 'DUMP REPORTED BY YOU'
                          : 'COMMUNITY DUMP REPORT'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalTitle}>{detailsModalItem.title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {detailsModalItem.facilityType || detailsModalItem.wasteType || 'Civic Waste Location'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDetailsModalItem(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close-circle" size={28} color={colors.primary600} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Meta Summary Row */}
                <View style={styles.modalMetaCard}>
                  <View style={styles.modalMetaCol}>
                    <Text style={styles.modalMetaLabel}>Status</Text>
                    <Text style={[styles.modalMetaVal, { color: detailsModalItem.statusColor || '#166534' }]}>
                      {detailsModalItem.status}
                    </Text>
                  </View>
                  {detailsModalItem.date && (
                    <View style={styles.modalMetaCol}>
                      <Text style={styles.modalMetaLabel}>Logged</Text>
                      <Text style={styles.modalMetaVal}>{detailsModalItem.date}</Text>
                    </View>
                  )}
                  {detailsModalItem.severity && (
                    <View style={styles.modalMetaCol}>
                      <Text style={styles.modalMetaLabel}>Severity</Text>
                      <Text style={[styles.modalMetaVal, { color: detailsModalItem.severityLevel === 'critical' ? '#DC2626' : '#D97706' }]}>
                        {detailsModalItem.severity}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Photo Evidence (if dump report) */}
                {detailsModalItem.photoUri && (
                  <View style={styles.modalPhotoBox}>
                    <Image source={{ uri: detailsModalItem.photoUri }} style={styles.modalPhoto} resizeMode="cover" />
                    <View style={styles.modalPhotoTag}>
                      <Text style={styles.modalPhotoTagText}>Reported Photo Proof</Text>
                    </View>
                  </View>
                )}

                {/* Full Physical Location Details */}
                <View style={styles.modalSectionBox}>
                  <View style={styles.modalSectionTitleRow}>
                    <Ionicons name="location" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Physical Location & GPS</Text>
                  </View>
                  <Text style={styles.modalSectionContent}>
                    {detailsModalItem.fullAddress || detailsModalItem.address}
                  </Text>
                  <Text style={styles.modalCoordsText}>
                    GPS: {detailsModalItem.latitude.toFixed(5)}° N, {detailsModalItem.longitude.toFixed(5)}° E
                  </Text>
                </View>

                {/* Operating Hours (for NGOs) */}
                {detailsModalItem.isNgo && detailsModalItem.timings && (
                  <View style={styles.modalSectionBox}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="time" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>Operating & Drop-off Hours</Text>
                    </View>
                    <Text style={styles.modalSectionContent}>{detailsModalItem.timings}</Text>
                  </View>
                )}

                {/* Accepted Recyclable Streams (for NGOs) */}
                {detailsModalItem.isNgo && detailsModalItem.streams && (
                  <View style={styles.modalSectionBox}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="cube" size={16} color="#166534" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>Accepted Material Streams ({detailsModalItem.streams.length})</Text>
                    </View>
                    <View style={styles.modalStreamGrid}>
                      {detailsModalItem.streams.map((st, idx) => (
                        <View key={idx} style={styles.modalStreamPill}>
                          <Ionicons name="checkmark-circle" size={12} color="#166534" style={{ marginRight: 4 }} />
                          <Text style={styles.modalStreamText}>{st}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Guidelines / Citizen Notes */}
                {(detailsModalItem.guidelines || detailsModalItem.notes) && (
                  <View style={styles.modalSectionBox}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="alert-circle" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>
                        {detailsModalItem.isNgo ? 'Drop-off Guidelines' : 'Observation Notes'}
                      </Text>
                    </View>
                    <Text style={styles.modalSectionContent}>
                      {detailsModalItem.guidelines || detailsModalItem.notes}
                    </Text>
                  </View>
                )}

                {/* Official Municipal Authority (if dump) */}
                {detailsModalItem.authority && (
                  <View style={styles.modalSectionBox}>
                    <View style={styles.modalSectionTitleRow}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.primary800} style={{ marginRight: 6 }} />
                      <Text style={styles.modalSectionTitle}>Assigned Municipal Authority</Text>
                    </View>
                    <Text style={styles.modalSectionContent}>{detailsModalItem.authority}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Footer Action Buttons */}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDirectionsBtn}
                  onPress={() => handleDirections(detailsModalItem.latitude, detailsModalItem.longitude)}
                >
                  <Ionicons name="navigate" size={15} color={colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalDirectionsBtnText}>Directions in Google Maps</Text>
                </TouchableOpacity>

                {detailsModalItem.isNgo && (
                  <TouchableOpacity
                    style={styles.modalDirectoryBtn}
                    onPress={() => {
                      setDetailsModalItem(null);
                      navigation.navigate('NgoTab', { focusHubId: detailsModalItem.id });
                    }}
                  >
                    <Ionicons name="list" size={15} color={colors.primary800} style={{ marginRight: 6 }} />
                    <Text style={styles.modalDirectoryBtnText}>Open in Directory</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaOverride: { flex: 1, backgroundColor: '#ffffff' },
  webWrapper: { flex: 1, alignItems: 'center', backgroundColor: Platform.OS === 'web' ? '#f3f6f3' : '#ffffff' },
  maxContainer: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cardBg || '#f4f8f4',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.primary800, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  addReportBtnText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginHorizontal: spacing.base,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  searchClearBtn: {
    padding: 4,
  },
  primaryTabBar: { marginVertical: spacing.xs },
  primaryTabScroll: { paddingHorizontal: spacing.base, gap: 8 },
  primaryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryTabActiveNgo: { backgroundColor: '#166534', borderColor: '#166534' },
  primaryTabActiveUser: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  primaryTabActiveDump: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  primaryTabActiveAll: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  primaryTabText: { fontSize: 11.5, fontWeight: '700', color: colors.textPrimary },
  primaryTabTextActive: { color: colors.white },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  modeBtnActive: { backgroundColor: colors.primary800 },
  modeBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  modeBtnTextActive: { color: colors.white },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary50 || '#f0fdf4',
    borderWidth: 1,
    borderColor: colors.primary600,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  gpsBtnLoading: { opacity: 0.6 },
  gpsBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  zoomGroup: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  zoomBtn: { paddingHorizontal: 7, paddingVertical: 4 },
  zoomDivider: { width: 1, height: 14, backgroundColor: colors.border },
  mapContainer: {
    marginHorizontal: spacing.base,
    height: 270,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#E8F4EC',
  },
  nativeMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: '#F8FAFC',
  },
  nativeMapText: { fontSize: 16, fontWeight: '800', color: colors.primary800, marginTop: 10 },
  nativeMapSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  openGoogleMapsBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  openGoogleMapsBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  activeLocationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeLocationText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  filterBar: { marginVertical: spacing.xs },
  filterScroll: { paddingHorizontal: spacing.base, gap: 8 },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderColor: colors.border,
  },
  locationPillNgo: { borderColor: '#86EFAC' },
  locationPillMyReport: { borderColor: '#FDE68A' },
  locationPillDump: { borderColor: '#FCA5A5' },
  locationPillActive: { backgroundColor: colors.primary800, borderColor: colors.primary800 },
  locationPillText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, maxWidth: 170 },
  locationPillTextActive: { color: colors.white },
  bottomArea: { flex: 1, paddingHorizontal: spacing.base, marginTop: spacing.xs },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  markerTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  markerTypeBadgeText: { fontSize: 9.5, fontWeight: '800' },
  markerTitle: { fontSize: 16, fontWeight: '800', color: colors.primary800, marginTop: 2 },
  markerAddress: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  closeCalloutBtn: { padding: 4 },
  ngoStreamsBox: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  ngoStreamsTitle: { fontSize: 11, fontWeight: '700', color: '#166534', marginBottom: 6 },
  ngoStreamPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ngoStreamChip: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ngoStreamChipText: { fontSize: 10, fontWeight: '600', color: '#166534' },
  photoContainer: { position: 'relative', marginTop: 10 },
  detailPhoto: { width: '100%', height: 130, borderRadius: radius.md },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  photoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  notesBox: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    padding: 10,
    borderRadius: radius.md,
    marginTop: 10,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  notesText: { fontSize: 12, color: colors.textPrimary, marginTop: 2, lineHeight: 17 },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  statusVal: { fontSize: 12, fontWeight: '800' },
  detailActionButtons: { flexDirection: 'row', gap: 6 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  directionsBtnText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  ngoDirLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  ngoDirLinkBtnText: { color: colors.primary800, fontSize: 11, fontWeight: '700' },
  sectionContainer: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: colors.primary800 },
  sectionCountBadge: { backgroundColor: colors.primary50, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  sectionCountText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  myDumpCard: {
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  myDumpTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  myDumpBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusPillText: { fontSize: 9.5, fontWeight: '800' },
  myDumpTime: { fontSize: 10, color: colors.textSecondary },
  myDumpTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  myDumpAddress: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  myDumpThumb: { width: 55, height: 55, borderRadius: radius.md },
  myDumpNotes: { fontSize: 11.5, color: '#475569', fontStyle: 'italic', marginTop: 6 },
  myDumpActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  myDumpMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  myDumpMapBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary800 },
  myDumpDirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  myDumpDirBtnText: { fontSize: 11, fontWeight: '700', color: colors.white },
  emptyPrompt: {
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderRadius: radius.xl,
    padding: spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
  },
  emptyPromptTitle: { fontSize: 14, fontWeight: '800', color: colors.primary800, marginTop: 6 },
  emptyPromptSub: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 16, maxWidth: 300 },
  emptyReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    marginTop: 10,
  },
  emptyReportBtnText: { color: colors.white, fontSize: 11.5, fontWeight: '800' },
  ngoCard: {
    backgroundColor: colors.white,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  ngoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ngoName: { fontSize: 16, fontWeight: '800', color: colors.primary800, textTransform: 'lowercase' },
  ngoBadge: { backgroundColor: colors.primary800, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  ngoBadgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  ngoAddress: { fontSize: 11.5, color: colors.textSecondary, marginTop: 3 },
  ngoStreamsSub: { fontSize: 10.5, fontWeight: '700', color: colors.textSecondary, marginTop: 8, marginBottom: 4 },
  streamPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streamPillText: { fontSize: 10, color: colors.primary800, fontWeight: '600' },
  ngoCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // MODAL STYLES FOR SHOW DETAILS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.base,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.primary800, marginTop: 2 },
  modalSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalBody: { marginBottom: 12 },
  modalMetaCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary50 || '#f0fdf4',
    padding: 12,
    borderRadius: radius.md,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  modalMetaCol: { flex: 1 },
  modalMetaLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  modalMetaVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  modalPhotoBox: { position: 'relative', marginBottom: 12 },
  modalPhoto: { width: '100%', height: 160, borderRadius: radius.md },
  modalPhotoTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  modalPhotoTagText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  modalSectionBox: {
    backgroundColor: colors.cardBg || '#f8fafc',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalSectionTitle: { fontSize: 12, fontWeight: '800', color: colors.primary800 },
  modalSectionContent: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 18 },
  modalCoordsText: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  modalStreamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  modalStreamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modalStreamText: { fontSize: 11, color: '#166534', fontWeight: '700' },
  modalFooterActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary800,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  modalDirectionsBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  modalDirectoryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBg || '#f4f8f4',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  modalDirectoryBtnText: { color: colors.primary800, fontSize: 12.5, fontWeight: '700' },
});
