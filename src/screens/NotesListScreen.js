import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { deleteNote, getNotes, toggleNoteFavorite } from '../storage/storage';
import { hexAlpha, getContrastText, getWallpaperOverlayStyle } from '../utils/colorUtils';
import { animateLayout } from '../utils/animations';
import {
  UI_FONTS,
  UI_RADIUS,
  UI_SPACING,
  getGlassBorder,
  getScreenGradient,
} from '../theme/ui';
import { EmptyState, IconCircleButton, ScreenHeader, SearchField } from '../components/ui';
import BottomNavigation from '../components/BottomNavigation';

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function TagChip({ label, textColor }) {
  return (
    <View style={[styles.tagChip, { backgroundColor: hexAlpha(textColor, 0.1) }]}>
      <Text style={[styles.tagChipText, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function NoteCard({ note, onPress, onDelete, onToggleFavorite, colors, isDark }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(18)).current;
  const hasWallpaper = Boolean(note.wallpaperUri);
  const bgColor = note.bgColor || colors.card;
  const textColor = hasWallpaper ? '#FFFFFF' : note.bgColor ? getContrastText(note.bgColor) : colors.text;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim, translateYAnim]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.985, friction: 5, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const handleLongPress = () => {
    Alert.alert('Delete Note', `Delete "${note.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(note.id) },
    ]);
  };

  const previewText = stripHtml(note.content).slice(0, 120) || 'No content yet...';

  const cardContent = (
    <View style={styles.noteCardContent}>
      <View style={styles.noteTopRow}>
        <View style={styles.noteMetaLeft}>
          <View style={[styles.noteAccent, { backgroundColor: hexAlpha('#C9A84C', 0.95) }]} />
          <Text style={[styles.noteDate, { color: hexAlpha(textColor, 0.55) }]}>
            {new Date(note.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onToggleFavorite(note.id)} hitSlop={10}>
          <Feather name="star" size={17} color={note.isFavorite ? '#C9A84C' : hexAlpha(textColor, 0.4)} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.noteTitle, { color: textColor }]} numberOfLines={1}>
        {note.title || 'Untitled'}
      </Text>
      <Text style={[styles.noteSnippet, { color: hexAlpha(textColor, 0.74) }]} numberOfLines={3}>
        {previewText}
      </Text>
      {note.tags?.length ? (
        <View style={styles.noteTagsRow}>
          {note.tags.slice(0, 3).map(tag => (
            <TagChip key={tag} label={tag} textColor={textColor} />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(note)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        style={[
          styles.noteCard,
          {
            borderColor: hasWallpaper
              ? hexAlpha('#FFFFFF', 0.12)
              : isDark
                ? hexAlpha(textColor, 0.12)
                : hexAlpha('#000000', 0.08),
          },
        ]}
      >
        {hasWallpaper ? (
          <ImageBackground
            source={{ uri: note.wallpaperUri }}
            resizeMode="cover"
            imageStyle={styles.noteCardImage}
            style={styles.noteCardSurface}
          >
            <View style={[StyleSheet.absoluteFill, getWallpaperOverlayStyle(true)]} />
            {cardContent}
          </ImageBackground>
        ) : (
          <View style={[styles.noteCardSurface, { backgroundColor: bgColor }]}>{cardContent}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotesListScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [query, setQuery] = useState(route.params?.query || '');

  useEffect(() => {
    if (typeof route.params?.query === 'string') {
      setQuery(route.params.query);
    }
  }, [route.params?.query]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadNotes = async () => {
        const storedNotes = await getNotes();
        if (!isMounted) {
          return;
        }

        animateLayout('spring');
        setNotes(storedNotes);
        setIsLoading(false);
      };

      loadNotes();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleDelete = async id => {
    animateLayout('spring');
    const updated = await deleteNote(id);
    setNotes(updated);
  };

  const filteredNotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...notes]
      .filter(note => (showFavoritesOnly ? note.isFavorite : true))
      .filter(note => {
        if (!normalized) {
          return true;
        }

        return `${note.title} ${stripHtml(note.content)} ${(note.tags || []).join(' ')}`
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return Number(b.isFavorite) - Number(a.isFavorite);
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [notes, query, showFavoritesOnly]);

  return (
    <LinearGradient colors={getScreenGradient(isDark)} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Notes"
          subtitle={isLoading ? 'Loading your workspace' : `${filteredNotes.length} results in view`}
          colors={colors}
          isDark={isDark}
          onBack={() => navigation.goBack()}
          rightAction={
            <IconCircleButton
              icon="plus"
              onPress={() => navigation.navigate('NoteEditor', { note: null })}
              colors={colors}
              backgroundColor={hexAlpha('#C9A84C', 0.16)}
              color="#C9A84C"
            />
          }
        />

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search title, content, or tags"
          colors={colors}
          isDark={isDark}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setShowFavoritesOnly(false)}
            style={[
              styles.filterChip,
              {
                backgroundColor: !showFavoritesOnly ? '#C9A84C' : isDark ? '#101010' : '#F5F5F5',
                borderColor: !showFavoritesOnly ? '#C9A84C' : getGlassBorder(colors, isDark),
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: !showFavoritesOnly ? '#000000' : colors.text }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFavoritesOnly(true)}
            style={[
              styles.filterChip,
              {
                backgroundColor: showFavoritesOnly ? '#C9A84C' : isDark ? '#101010' : '#F5F5F5',
                borderColor: showFavoritesOnly ? '#C9A84C' : getGlassBorder(colors, isDark),
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: showFavoritesOnly ? '#000000' : colors.text }]}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <EmptyState
            icon="loader"
            title="Loading notes"
            subtitle="Preparing your writing space"
            colors={colors}
            tint={colors.subtext}
          />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No notes found"
            subtitle="Create a note or adjust your search to see matches here."
            colors={colors}
          />
        ) : (
          <FlatList
            data={filteredNotes}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                colors={colors}
                isDark={isDark}
                onPress={selectedNote => navigation.navigate('NoteEditor', { note: selectedNote })}
                onDelete={handleDelete}
                onToggleFavorite={async id => {
                  animateLayout('spring');
                  const updated = await toggleNoteFavorite(id);
                  setNotes(updated);
                }}
              />
            )}
          />
        )}

        <BottomNavigation
          colors={colors}
          isDark={isDark}
          navigation={navigation}
          currentRoute="NotesList"
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: UI_SPACING.lg, paddingBottom: UI_SPACING.lg },
  filterRow: { flexDirection: 'row', gap: 10, marginTop: UI_SPACING.md, marginBottom: UI_SPACING.md },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: UI_RADIUS.round,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: UI_SPACING.xxxl, gap: UI_SPACING.md },
  noteCard: { borderRadius: UI_RADIUS.md, borderWidth: 1, overflow: 'hidden' },
  noteCardSurface: { minHeight: 180 },
  noteCardImage: { borderRadius: UI_RADIUS.md },
  noteCardContent: { flex: 1, padding: UI_SPACING.lg, justifyContent: 'space-between' },
  noteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: UI_SPACING.lg,
  },
  noteMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteAccent: { width: 28, height: 3, borderRadius: UI_RADIUS.round },
  noteDate: { fontSize: 11, letterSpacing: 0.4 },
  noteTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
    marginBottom: UI_SPACING.sm,
  },
  noteSnippet: { fontSize: 13, lineHeight: 20 },
  noteTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: UI_SPACING.md },
  tagChip: { borderRadius: UI_RADIUS.round, paddingHorizontal: 10, paddingVertical: 6 },
  tagChipText: { fontSize: 11, fontWeight: '700' },
});
