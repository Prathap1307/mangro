import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const SECRET_USERNAME = 'user12';
const SECRET_PASSWORD = 'user12';
const ACTION_LOG_KEY = 'mangro_user_actions_v1';
const REQUIRED_TAPS = 10;

const categories = ['🍔 Burger', '🍕 Pizza', '🥗 Healthy', '🍣 Sushi'];
const restaurants = [
  { name: 'Smash House', meta: 'American • $$', rating: '⭐ 4.8', eta: '20-30 min', delivery: '$0 delivery', emoji: '🍔' },
  { name: 'Sakura Bowl', meta: 'Japanese • $$$', rating: '⭐ 4.7', eta: '15-25 min', delivery: '$1.99 delivery', emoji: '🍣' },
];

export default function App() {
  const [tapCount, setTapCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [actions, setActions] = useState([]);
  const [search, setSearch] = useState('');
  const [mediaPermission, setMediaPermission] = useState('not requested');
  const [mediaItems, setMediaItems] = useState([]);
  const resetTimerRef = useRef(null);

  const navItems = useMemo(() => ['Home', 'Orders', 'Favorites', 'Profile'], []);

  const logAction = async (action, detail = '') => {
    const entry = { at: new Date().toISOString(), action, detail };
    const next = [...actions, entry].slice(-100);
    setActions(next);
    await AsyncStorage.setItem(ACTION_LOG_KEY, JSON.stringify(next));
  };

  const loadActions = async () => {
    const raw = await AsyncStorage.getItem(ACTION_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    setActions(parsed);
  };

  useEffect(() => {
    loadActions();
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const onSecretTap = () => {
    const next = tapCount + 1;
    setTapCount(next);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => setTapCount(0), 3500);

    if (next >= REQUIRED_TAPS) {
      setTapCount(0);
      setShowAdminLogin(true);
      logAction('Secret admin gesture', '10 taps detected');
    }
  };

  const handleAdminLogin = () => {
    if (username.trim() === SECRET_USERNAME && password === SECRET_PASSWORD) {
      setIsAdmin(true);
      setLoginError('');
      return;
    }
    setLoginError('Invalid username or password.');
  };

  const requestMediaAccess = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMediaPermission('denied');
      return;
    }

    setMediaPermission('granted');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    setMediaItems(result.assets || []);
    await logAction('Media access', `Selected ${result.assets?.length || 0} item(s)`);
  };

  if (showAdminLogin) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        {!isAdmin ? (
          <View style={styles.adminCard}>
            <Text style={styles.title}>Secret Admin Login</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="Username" style={styles.input} />
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" style={styles.input} />
            {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAdminLogin}>
              <Text style={styles.primaryBtnText}>Access Admin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.adminCard}>
            <Text style={styles.title}>Mangro Secret Admin</Text>
            <Text style={styles.sub}>You are acting as admin.</Text>

            <Text style={styles.section}>User Actions</Text>
            {actions.slice().reverse().map((item, idx) => (
              <Text key={`${item.at}-${idx}`} style={styles.listItem}>
                {new Date(item.at).toLocaleString()} — {item.action}
                {item.detail ? `: ${item.detail}` : ''}
              </Text>
            ))}

            <TouchableOpacity style={styles.primaryBtn} onPress={requestMediaAccess}>
              <Text style={styles.primaryBtnText}>Request Photos & Videos</Text>
            </TouchableOpacity>
            <Text style={styles.sub}>Media permission: {mediaPermission}</Text>

            <View style={styles.grid}>
              {mediaItems.map((asset) =>
                asset.type === 'video' ? (
                  <View key={asset.uri} style={styles.mediaCard}>
                    <Text style={styles.videoTag}>🎬 Video selected</Text>
                    <Text numberOfLines={1} style={styles.caption}>{asset.fileName || 'video'}</Text>
                  </View>
                ) : (
                  <View key={asset.uri} style={styles.mediaCard}>
                    <Image source={{ uri: asset.uri }} style={styles.image} />
                    <Text numberOfLines={1} style={styles.caption}>{asset.fileName || 'image'}</Text>
                  </View>
                )
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity activeOpacity={1} style={styles.container} onPress={onSecretTap}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.muted}>Deliver to</Text>
            <Text style={styles.location}>Downtown, San Francisco</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search restaurants, dishes..."
          value={search}
          onChangeText={setSearch}
          onEndEditing={() => search.trim() && logAction('Search', search.trim())}
        />

        <View style={styles.hero}>
          <View>
            <Text style={styles.chip}>FREE DELIVERY</Text>
            <Text style={styles.heroTitle}>Fresh food in under 25 mins</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => logAction('Hero CTA', 'Order now clicked')}>
              <Text style={styles.primaryBtnText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.emoji}>🍜</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={styles.pill} onPress={() => logAction('Category', cat)}>
              <Text>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={{ flex: 1 }}>
          {restaurants.map((r) => (
            <View key={r.name} style={styles.card}>
              <Text style={styles.bigEmoji}>{r.emoji}</Text>
              <Text style={styles.cardTitle}>{r.name}</Text>
              <Text style={styles.muted}>{r.meta}</Text>
              <Text style={styles.muted}>{r.rating} • {r.eta} • {r.delivery}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.nav}>
          {navItems.map((item) => (
            <TouchableOpacity key={item} onPress={() => logAction('Navigation', item)}>
              <Text style={styles.muted}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { color: '#6b7280' },
  location: { fontWeight: '700', marginTop: 4 },
  avatar: { height: 40, width: 40, borderRadius: 20, backgroundColor: '#0f9d58', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  search: { marginTop: 12, backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 12, padding: 12 },
  hero: { marginTop: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  chip: { backgroundColor: '#dff7ea', color: '#0a7f46', fontSize: 11, fontWeight: '700', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  heroTitle: { fontWeight: '700', marginVertical: 8 },
  emoji: { fontSize: 42 },
  primaryBtn: { marginTop: 8, backgroundColor: '#0f9d58', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  row: { marginTop: 12, maxHeight: 44 },
  pill: { backgroundColor: '#fff', borderRadius: 999, borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  card: { marginTop: 10, backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 14, padding: 12 },
  bigEmoji: { fontSize: 36 },
  cardTitle: { fontWeight: '700', marginTop: 6 },
  nav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  adminCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, borderColor: '#e5e7eb', borderWidth: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { color: '#6b7280' },
  input: { borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 10, padding: 10 },
  error: { color: '#b91c1c' },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  listItem: { fontSize: 13, color: '#111827' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaCard: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  image: { width: '100%', height: 120 },
  caption: { padding: 8, fontSize: 12, color: '#6b7280' },
  videoTag: { padding: 8, fontWeight: '700' },
});
