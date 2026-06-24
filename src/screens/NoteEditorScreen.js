import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Image,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { PALETTE, useTheme } from '../context/ThemeContext';
import { hexAlpha, getContrastText, getWallpaperOverlayStyle } from '../utils/colorUtils';
import { saveNote } from '../storage/storage';
import { UI_FONTS, UI_RADIUS, UI_SPACING } from '../theme/ui';
import BottomNavigation from '../components/BottomNavigation';

function getEditorHtml(editorBackground, textColor, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
  <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
  <style>
    :root {
      --toolbar-height: 40px;
      --keyboard-offset: 0px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100vh; background: ${editorBackground}; }
    body { color: ${textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow: hidden; position: relative; }
    #editor-shell { height: 100vh; padding-bottom: calc(var(--toolbar-height) + var(--keyboard-offset)); }
    #editor { background: transparent; }
    .ql-toolbar.ql-snow {
      position: fixed;
      left: 0;
      right: 0;
      bottom: var(--keyboard-offset);
      display: flex;
      align-items: center;
      gap: 2px;
      min-height: 40px;
      padding: 4px 6px calc(4px + env(safe-area-inset-bottom));
      background: rgba(0, 0, 0, 0.96);
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 0;
      box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.22);
      overflow: visible;
      white-space: nowrap;
      z-index: 20;
      -webkit-overflow-scrolling: touch;
    }
    .ql-toolbar.ql-snow::-webkit-scrollbar { display: none; }
    .ql-toolbar.ql-snow .ql-formats { display: inline-flex; align-items: center; margin-right: 6px; position: relative; }
    .ql-toolbar .ql-picker { position: relative; color: #FFFFFF; }
    .ql-toolbar.ql-snow button,
    .ql-toolbar.ql-snow .ql-picker-label {
      width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .ql-toolbar.ql-snow .ql-picker.ql-header {
      min-width: 96px;
      margin-right: 6px;
    }
    .ql-toolbar.ql-snow .ql-picker.ql-header .ql-picker-label {
      width: 100%;
      justify-content: flex-start;
      padding: 0 24px 0 8px;
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(255, 255, 255, 0.08);
    }
    .ql-toolbar.ql-snow .ql-picker.ql-header .ql-picker-label::before {
      font-size: 12px;
    }
    .ql-toolbar .ql-stroke { stroke: #FFFFFF; }
    .ql-toolbar .ql-fill { fill: #FFFFFF; }
    .ql-toolbar .ql-picker-options {
      left: 0;
      right: auto;
      top: auto;
      bottom: calc(100% + 8px);
      min-width: 188px;
      padding: 8px 0;
      background: #000000;
      border: 1px solid #000000;
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.35);
      border-radius: 12px;
      max-height: 180px;
      overflow-y: auto;
      transform: translateY(-6px);
      z-index: 30;
    }
    .ql-toolbar .ql-picker.ql-expanded .ql-picker-options {
      top: auto !important;
      bottom: calc(100% + 8px) !important;
      display: block;
    }
    .ql-toolbar .ql-picker-item,
    .ql-toolbar .ql-picker-label::before,
    .ql-toolbar .ql-picker-item::before {
      color: #FFFFFF;
    }
    .ql-toolbar .ql-picker.ql-expanded .ql-picker-label {
      border-color: #FFFFFF;
      background: #000000;
      color: #FFFFFF;
    }
    .ql-toolbar .ql-picker-item {
      display: flex;
      align-items: center;
      padding: 10px 14px;
      background: #000000;
    }
    .ql-toolbar .ql-picker-item:hover,
    .ql-toolbar .ql-picker-item.ql-selected {
      background: #111111;
    }
    .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
    .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
      content: "Heading 1";
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
    .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
      content: "Heading 2";
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .ql-toolbar .ql-picker.ql-header .ql-picker-label:not([data-value])::before,
    .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="false"]::before {
      content: "Normal";
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .ql-container.ql-snow { border: none; font-size: 16px; height: 100%; background: transparent; }
    .ql-editor { min-height: 100%; padding: 24px 18px 24px; line-height: 1.78; color: ${textColor}; background: transparent; }
    .ql-editor.ql-blank::before { color: ${textColor === '#FFFFFF' ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.28)'}; font-style: italic; left: 18px; }
    .ql-editor h1, .ql-editor h2, .ql-editor p, .ql-editor li { color: ${textColor}; }
  </style>
</head>
<body>
  <div id="toolbar">
    <span class="ql-formats">
      <select class="ql-header">
        <option selected></option>
        <option value="1"></option>
        <option value="2"></option>
      </select>
    </span>
    <span class="ql-formats">
      <button class="ql-bold"></button>
      <button class="ql-italic"></button>
      <button class="ql-underline"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-align"></button>
      <button class="ql-align" value="center"></button>
      <button class="ql-align" value="right"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-list" value="ordered"></button>
      <button class="ql-list" value="bullet"></button>
    </span>
    <span class="ql-formats">
      <button class="ql-clean"></button>
    </span>
  </div>
  <div id="editor-shell">
    <div id="editor">${content || ''}</div>
  </div>
  <script>
    var quill = new Quill('#editor', {
      theme: 'snow',
      placeholder: 'Begin your royal story...',
      modules: {
        toolbar: '#toolbar'
      }
    });
    var toolbar = document.getElementById('toolbar');

    function syncViewportInsets() {
      var toolbarHeight = toolbar ? toolbar.offsetHeight : 40;
      var viewport = window.visualViewport;
      var keyboardOffset = 0;
      if (viewport) {
        keyboardOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      }
      document.documentElement.style.setProperty('--toolbar-height', toolbarHeight + 'px');
      document.documentElement.style.setProperty('--keyboard-offset', keyboardOffset + 'px');
    }

    syncViewportInsets();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewportInsets);
      window.visualViewport.addEventListener('scroll', syncViewportInsets);
    }
    window.addEventListener('resize', syncViewportInsets);

    quill.on('text-change', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'content',
        html: quill.root.innerHTML
      }));
    });
  </script>
</body>
</html>`;
}

function TagInput({ tags, setTags, textColor }) {
  const [tagInput, setTagInput] = useState('');

  const addTag = value => {
    const next = value.trim();
    if (!next || tags.includes(next)) {
      return;
    }
    setTags([...tags, next]);
    setTagInput('');
  };

  return (
    <View style={styles.tagsBlock}>
      <View style={styles.tagsRow}>
        {tags.map(tag => (
          <View key={tag} style={[styles.tagPill, { backgroundColor: hexAlpha(textColor, 0.1) }]}>
            <Text style={[styles.tagPillText, { color: textColor }]}>{tag}</Text>
            <TouchableOpacity onPress={() => setTags(tags.filter(item => item !== tag))}>
              <Feather name="x" size={13} color={hexAlpha(textColor, 0.72)} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TextInput
        style={[styles.tagInput, { color: textColor, backgroundColor: hexAlpha(textColor, 0.08) }]}
        placeholder="Add tag..."
        placeholderTextColor={hexAlpha(textColor, 0.45)}
        value={tagInput}
        onChangeText={setTagInput}
        onSubmitEditing={() => addTag(tagInput)}
        onBlur={() => addTag(tagInput)}
        returnKeyType="done"
      />
    </View>
  );
}

function ThemePickerModal({ visible, onClose, onSelectColor, onSelectWallpaper, currentColor, colors }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Note Theme</Text>
          <Text style={[styles.modalSub, { color: colors.subtext }]}>Choose a background color or wallpaper</Text>

          <View style={styles.colorGrid}>
            {PALETTE.colors.map(color => (
              <TouchableOpacity
                key={color.id}
                onPress={() => onSelectColor(color.value)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.value },
                  currentColor === color.value && styles.swatchSelected,
                ]}
              >
                {currentColor === color.value && (
                  <Feather name="check" size={16} color={getContrastText(color.value)} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={onSelectWallpaper}
            style={[styles.wallpaperBtn, { borderColor: hexAlpha(colors.text, 0.08) }]}
          >
            <Feather name="image" size={18} color={colors.text} style={styles.wallpaperBtnIcon} />
            <Text style={[styles.wallpaperBtnText, { color: colors.text }]}>Choose wallpaper from gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function NoteEditorScreen({ route, navigation }) {
  const { note } = route.params || {};
  const { colors } = useTheme();

  const [title, setTitle] = useState(note?.title || '');
  const [htmlContent, setHtmlContent] = useState(note?.content || '');
  const [bgColor, setBgColor] = useState(note?.bgColor || '#0D1B2A');
  const [wallpaperUri, setWallpaperUri] = useState(note?.wallpaperUri || null);
  const [tags, setTags] = useState(note?.tags || []);
  const [isFavorite, setIsFavorite] = useState(Boolean(note?.isFavorite));
  const [themeVisible, setThemeVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveAnim = useRef(new Animated.Value(1)).current;
  const initialHtmlContentRef = useRef(note?.content || '');

  const textColor = wallpaperUri ? '#FFFFFF' : getContrastText(bgColor);
  const editorBackground = wallpaperUri ? 'transparent' : bgColor;

  const editorHtml = useMemo(
    () => getEditorHtml(editorBackground, textColor, initialHtmlContentRef.current),
    [editorBackground, textColor]
  );

  const handleSave = async () => {
    const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();
    if (!title.trim() && !plainText) {
      Alert.alert('Empty Note', 'Add a title or some content first.');
      return;
    }

    setSaving(true);
    Animated.sequence([
      Animated.timing(saveAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(saveAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    await saveNote({
      id: note?.id,
      title: title.trim() || 'Untitled',
      content: htmlContent,
      bgColor: wallpaperUri ? null : bgColor,
      wallpaperUri,
      tags,
      isFavorite,
    });

    setSaving(false);
    navigation.goBack();
  };

  const handleWallpaper = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Allow photo library access to use wallpapers.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setWallpaperUri(result.assets[0].uri);
      setThemeVisible(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={textColor === '#FFFFFF' ? 'light-content' : 'dark-content'} />

      {wallpaperUri ? (
        <Image source={{ uri: wallpaperUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
      )}

      {wallpaperUri ? <View style={[StyleSheet.absoluteFill, getWallpaperOverlayStyle(true)]} /> : null}

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.contentInset}>
            <View style={styles.topPanel}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.iconBtn, { backgroundColor: hexAlpha(textColor, 0.08) }]}
              >
                <Feather name="chevron-left" size={20} color={textColor} />
              </TouchableOpacity>

              <View style={styles.topPanelCopy}>
                <Text style={[styles.editorLabel, { color: hexAlpha(textColor, 0.72) }]}>NOTE EDITOR</Text>
                <TextInput
                  style={[styles.titleInput, { color: textColor }]}
                  placeholder="Note title..."
                  placeholderTextColor={hexAlpha(textColor, 0.45)}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <TouchableOpacity
                onPress={() => setIsFavorite(current => !current)}
                style={[styles.iconBtn, { backgroundColor: hexAlpha(textColor, 0.08) }]}
              >
                <Feather name="star" size={18} color={isFavorite ? '#C9A84C' : textColor} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setThemeVisible(true)}
                style={[styles.iconBtn, { backgroundColor: hexAlpha(textColor, 0.08) }]}
              >
                <Feather name="image" size={18} color={textColor} />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.metaPanel}>
              <Text style={[styles.metaLabel, { color: hexAlpha(textColor, 0.72) }]}>TAGS</Text>
              <TagInput tags={tags} setTags={setTags} textColor={textColor} />
            </View>
          </View>

          <View style={styles.editorFrame}>
            <WebView
              originWhitelist={['*']}
              source={{ html: editorHtml }}
              style={styles.webview}
              containerStyle={styles.webview}
              onMessage={event => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'content') {
                    setHtmlContent(data.html);
                  }
                } catch (_) {}
              }}
              scrollEnabled
              javaScriptEnabled
              keyboardDisplayRequiresUserAction={false}
              hideKeyboardAccessoryView
            />
          </View>
        </KeyboardAvoidingView>

        <BottomNavigation
          colors={colors}
          isDark={textColor === '#FFFFFF'}
          navigation={navigation}
          currentRoute="NoteEditor"
        />
      </SafeAreaView>

      <ThemePickerModal
        visible={themeVisible}
        onClose={() => setThemeVisible(false)}
        onSelectColor={color => {
          setBgColor(color);
          setWallpaperUri(null);
        }}
        onSelectWallpaper={handleWallpaper}
        currentColor={bgColor}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, paddingBottom: UI_SPACING.lg },
  content: { flex: 1 },
  contentInset: { paddingHorizontal: UI_SPACING.lg },
  topPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: UI_RADIUS.lg,
    padding: UI_SPACING.md,
    marginTop: UI_SPACING.lg,
    marginBottom: UI_SPACING.lg,
    gap: 8,
  },
  topPanelCopy: { flex: 1, marginHorizontal: UI_SPACING.xs },
  editorLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginBottom: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: UI_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
    paddingVertical: 0,
  },
  saveBtn: {
    backgroundColor: '#C9A84C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: UI_RADIUS.round,
  },
  saveBtnText: { color: '#0B0C0F', fontWeight: '700', fontSize: 14 },
  metaPanel: {
    borderRadius: UI_RADIUS.lg,
    padding: UI_SPACING.md,
    marginBottom: UI_SPACING.md,
  },
  metaLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginBottom: 8 },
  tagsBlock: { gap: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: UI_RADIUS.round,
  },
  tagPillText: { fontSize: 12, fontWeight: '700' },
  tagInput: {
    borderRadius: UI_RADIUS.round,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  editorFrame: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginTop: UI_SPACING.sm,
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  modalSheet: {
    borderTopLeftRadius: UI_RADIUS.xl,
    borderTopRightRadius: UI_RADIUS.xl,
    padding: UI_SPACING.xxl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: UI_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignSelf: 'center',
    marginBottom: UI_SPACING.lg,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', fontFamily: UI_FONTS.serif, marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: UI_SPACING.lg },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: UI_SPACING.md, marginBottom: UI_SPACING.xl },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: UI_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3, borderColor: '#C9A84C' },
  wallpaperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: UI_RADIUS.md,
    padding: 15,
    marginBottom: UI_SPACING.xl,
  },
  wallpaperBtnIcon: { marginRight: UI_SPACING.sm },
  wallpaperBtnText: { fontWeight: '600' },
  modalClose: {
    borderRadius: UI_RADIUS.round,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#C9A84C',
  },
  modalCloseText: { color: '#0B0C0F', fontWeight: '700', fontSize: 15 },
});
