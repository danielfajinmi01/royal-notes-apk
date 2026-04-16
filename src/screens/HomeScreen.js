import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getNotes, getScratchpad, getTodos, saveScratchpad } from '../storage/storage';
import { hexAlpha } from '../utils/colorUtils';
import {
  UI_FONTS,
  UI_RADIUS,
  UI_SPACING,
  getGlassBorder,
  getPanelColor,
  getScreenGradient,
  getMutedLine,
} from '../theme/ui';
import { IconCircleButton, SearchField } from '../components/ui';
import BottomNavigation from '../components/BottomNavigation';

const PRIMARY_ACTIONS = [
  {
    id: 'new-note',
    title: 'New note',
    subtitle: 'Open the editor and start writing',
    route: 'NoteEditor',
    params: { note: null },
    color: '#10B938',
    icon: 'plus',
  },
  {
    id: 'new-task',
    title: 'New task',
    subtitle: 'Organize today with clear next steps',
    route: 'Todo',
    color: '#7E22CE',
    icon: 'check-square',
  },
];

const QUICK_ACTIONS = [
  { id: 'notes', label: 'Notes', icon: 'file-text', route: 'NotesList' },
  { id: 'tasks', label: 'Tasks', icon: 'check-circle', route: 'Todo' },
  { id: 'scan', label: 'Scan', icon: 'camera', route: 'OCR' },
  { id: 'theme', label: 'Theme', icon: 'moon' },
];

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function ActionCard({ item, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.actionCard, { backgroundColor: item.color }]}>
      <View style={styles.actionIconWrap}>
        <Feather name={item.icon} size={18} color="#000000" />
      </View>
      <View>
        <Text style={styles.actionCardTitle}>{item.title}</Text>
        <Text style={styles.actionCardSub}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors, isDark, toggleDark } = useTheme();
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [scratchpad, setScratchpad] = useState('');
  const [query, setQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      (async () => {
        const [storedNotes, storedTodos, storedScratchpad] = await Promise.all([
          getNotes(),
          getTodos(),
          getScratchpad(),
        ]);

        if (!mounted) {
          return;
        }

        setNotes(storedNotes);
        setTodos(storedTodos);
        setScratchpad(storedScratchpad);
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return notes.slice(0, 3);
    }

    return notes
      .filter(note => {
        const tags = Array.isArray(note.tags) ? note.tags.join(' ') : '';
        return `${note.title} ${stripHtml(note.content)} ${tags}`.toLowerCase().includes(normalized);
      })
      .slice(0, 4);
  }, [notes, query]);

  const pendingTodos = todos.filter(todo => !todo.completed);

  const handleScratchpadChange = value => {
    setScratchpad(value);
    saveScratchpad(value);
  };

  return (
    <LinearGradient colors={getScreenGradient(isDark)} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.screenContent, { opacity: fadeAnim }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroRow}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>ROYAL NOTES</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>Start Writing with Royalty</Text>
                <Text style={[styles.heroSub, { color: colors.subtext }]}>
                  Capture your ideas, your ideas deserve a throne.
                </Text>
              </View>
              <IconCircleButton
                icon={isDark ? 'sun' : 'moon'}
                onPress={toggleDark}
                colors={colors}
                size={44}
                backgroundColor={getPanelColor(colors, isDark)}
                style={[
                  styles.themeButton,
                  {
                    borderWidth: 1,
                    borderColor: getGlassBorder(colors, isDark),
                  },
                ]}
              />
            </View>

            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Find any note, task or document"
              colors={colors}
              isDark={isDark}
              style={styles.searchBar}
              onSubmitEditing={() => navigation.navigate('NotesList', { query })}
            />

            <View style={styles.actionGrid}>
              {PRIMARY_ACTIONS.map(item => (
                <ActionCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate(item.route, item.params)}
                />
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}
            >
              {QUICK_ACTIONS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => (item.id === 'theme' ? toggleDark() : navigation.navigate(item.route))}
                  style={[
                    styles.quickActionCard,
                    {
                      backgroundColor: isDark ? '#111111' : '#F6F6F6',
                      borderColor: getGlassBorder(colors, isDark),
                    },
                  ]}
                >
                  <Feather
                    name={item.id === 'theme' ? (isDark ? 'sun' : 'moon') : item.icon}
                    size={22}
                    color={colors.text}
                  />
                  <Text style={[styles.quickActionLabel, { color: hexAlpha(colors.text, 0.82) }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View
              style={[
                styles.statsPanel,
                {
                  backgroundColor: getPanelColor(colors, isDark),
                  borderColor: getGlassBorder(colors, isDark),
                },
              ]}
            >
              <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('NotesList')}>
                <Text style={[styles.statValue, { color: colors.text }]}>{notes.length}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>notes</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: getMutedLine(colors, isDark) }]} />
              <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Todo')}>
                <Text style={[styles.statValue, { color: colors.text }]}>{pendingTodos.length}</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>pending tasks</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: getMutedLine(colors, isDark) }]} />
              <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('OCR')}>
                <Text style={[styles.statValue, { color: colors.text }]}>1</Text>
                <Text style={[styles.statLabel, { color: colors.subtext }]}>scanner</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent matches</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NotesList', { query })}>
                <Text style={[styles.sectionLink, { color: colors.accent }]}>Open notes</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultsList}>
              {filteredNotes.length === 0 ? (
                <View
                  style={[
                    styles.emptySearch,
                    {
                      backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA',
                      borderColor: getGlassBorder(colors, isDark),
                    },
                  ]}
                >
                  <Text style={[styles.emptySearchTitle, { color: colors.text }]}>No matching notes yet</Text>
                  <Text style={[styles.emptySearchSub, { color: colors.subtext }]}>
                    Try another search or create a new note from the cards above.
                  </Text>
                </View>
              ) : (
                filteredNotes.map(note => (
                  <TouchableOpacity
                    key={note.id}
                    onPress={() => navigation.navigate('NoteEditor', { note })}
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: isDark ? '#0D0D0D' : '#FAFAFA',
                        borderColor: getGlassBorder(colors, isDark),
                      },
                    ]}
                  >
                    <View style={styles.resultCardHeader}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                        {note.title || 'Untitled'}
                      </Text>
                      {note.isFavorite ? <Feather name="star" size={15} color="#C9A84C" /> : null}
                    </View>
                    <Text style={[styles.resultSnippet, { color: colors.subtext }]} numberOfLines={2}>
                      {stripHtml(note.content) || 'No content yet'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Scratch pad</Text>
              <Text style={[styles.sectionHint, { color: colors.subtext }]}>Auto-saved quick notes</Text>
            </View>

            <View
              style={[
                styles.scratchWrap,
                {
                  backgroundColor: isDark ? '#1A1A12' : '#F6F3E9',
                  borderColor: isDark ? '#2A2A1F' : '#E7E0CC',
                },
              ]}
            >
              <TextInput
                style={[styles.scratchInput, { color: isDark ? '#EAEAEA' : '#1A1A1A' }]}
                value={scratchpad}
                onChangeText={handleScratchpadChange}
                multiline
                textAlignVertical="top"
                placeholder="Start writing..."
                placeholderTextColor={isDark ? '#707070' : '#8A826C'}
              />
            </View>
          </ScrollView>

          <BottomNavigation
            colors={colors}
            isDark={isDark}
            navigation={navigation}
            currentRoute="Home"
          />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: UI_SPACING.lg },
  screenContent: { flex: 1 },
  scrollContent: { paddingTop: UI_SPACING.lg, paddingBottom: UI_SPACING.md },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', gap: UI_SPACING.md },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2.1, marginBottom: 10 },
  heroTitle: {
    maxWidth: 280,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: UI_FONTS.serif,
    fontWeight: '700',
  },
  heroSub: { maxWidth: 310, marginTop: 10, fontSize: 14, lineHeight: 21 },
  themeButton: {},
  searchBar: { marginTop: UI_SPACING.xxl, marginBottom: UI_SPACING.lg },
  actionGrid: { flexDirection: 'row', gap: UI_SPACING.md, marginBottom: UI_SPACING.lg },
  actionCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: UI_RADIUS.sm,
    padding: UI_SPACING.lg,
    justifyContent: 'space-between',
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionCardTitle: { color: '#000000', fontSize: 18, fontWeight: '700' },
  actionCardSub: { color: 'rgba(0,0,0,0.72)', fontSize: 13, lineHeight: 18, marginTop: 8 },
  quickActions: { gap: 14, paddingBottom: 4, marginBottom: UI_SPACING.lg },
  quickActionCard: {
    width: 88,
    height: 104,
    borderWidth: 1,
    borderRadius: UI_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600' },
  statsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: UI_RADIUS.lg,
    paddingVertical: UI_SPACING.lg,
    paddingHorizontal: UI_SPACING.md,
    marginBottom: UI_SPACING.xl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: UI_FONTS.serif, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.7 },
  statDivider: { width: 1, height: 34, marginHorizontal: UI_SPACING.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UI_SPACING.md,
  },
  sectionTitle: { fontSize: 20, fontFamily: UI_FONTS.serif, fontWeight: '700' },
  sectionLink: { fontSize: 13, fontWeight: '700' },
  sectionHint: { fontSize: 12 },
  resultsList: { gap: UI_SPACING.md, marginBottom: UI_SPACING.xl },
  resultCard: { borderWidth: 1, borderRadius: UI_RADIUS.md, padding: UI_SPACING.lg },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultTitle: { flex: 1, fontSize: 17, fontWeight: '700', marginRight: 10 },
  resultSnippet: { fontSize: 13, lineHeight: 19 },
  emptySearch: { borderWidth: 1, borderRadius: UI_RADIUS.md, padding: UI_SPACING.xl },
  emptySearchTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySearchSub: { fontSize: 13, lineHeight: 20 },
  scratchWrap: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: UI_RADIUS.sm,
    padding: UI_SPACING.lg,
  },
  scratchInput: { minHeight: 180, fontSize: 16, lineHeight: 24 },
});
