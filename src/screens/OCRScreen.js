import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { hexAlpha } from '../utils/colorUtils';
import { saveNote } from '../storage/storage';
import {
  UI_FONTS,
  UI_RADIUS,
  UI_SPACING,
  getScreenGradient,
} from '../theme/ui';
import { ScreenHeader } from '../components/ui';
import BottomNavigation from '../components/BottomNavigation';

let TextRecognition;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch {
  TextRecognition = {
    recognize: async () => ({
      text: '[OCR not available in Expo Go - run expo prebuild first]\n\nTo enable: npx expo prebuild && npx expo run:android',
      blocks: [],
    }),
  };
}

export default function OCRScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mode, setMode] = useState('home');
  const [imageUri, setImageUri] = useState(null);
  const [editableText, setEditableText] = useState('');
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeTransition = callback => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const enhanceImage = async uri => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch {
      return uri;
    }
  };

  const runOCR = async uri => {
    setLoading(true);
    try {
      const enhanced = await enhanceImage(uri);
      setImageUri(enhanced);
      const result = await TextRecognition.recognize(enhanced);
      const text = result.text || 'No text found in image.';
      setEditableText(text);
      fadeTransition(() => setMode('result'));
    } catch (error) {
      Alert.alert('OCR Error', 'Could not process the image. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      await runOCR(photo.uri);
    } catch {
      Alert.alert('Camera Error', 'Failed to capture photo.');
    }
  };

  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await runOCR(result.assets[0].uri);
    }
  };

  const handleSaveAsNote = async () => {
    if (!editableText.trim()) {
      return;
    }
    await saveNote({
      title: editableText.split('\n')[0]?.slice(0, 48) || 'Scanned Document',
      content: `<p>${editableText.replace(/\n/g, '</p><p>')}</p>`,
      bgColor: '#0D1B2A',
    });
    Alert.alert('Saved', 'The scanned text has been saved as a note.', [
      { text: 'View Notes', onPress: () => navigation.navigate('NotesList') },
      { text: 'Stay here', style: 'cancel' },
    ]);
  };

  const handleCopy = () => {
    Alert.alert('Copy unavailable', 'Clipboard support is not wired into this build yet.');
  };

  if (mode === 'home') {
    return (
      <LinearGradient colors={getScreenGradient(isDark)} style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safe}>
          <ScreenHeader
            title="Scanner"
            subtitle="Camera and gallery OCR with editable text"
            colors={colors}
            isDark={isDark}
            onBack={() => navigation.goBack()}
          />

          <Animated.View style={[styles.flexOne, { opacity: fadeAnim }]}>
            <View style={styles.heroBlock}>
              <View style={[styles.heroIconWrap, { backgroundColor: hexAlpha('#14B8A6', 0.14) }]}>
                <Feather name="file-text" size={34} color="#14B8A6" />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Extract text cleanly</Text>
              <Text style={[styles.heroSub, { color: colors.subtext }]}>
                Snap a document or pick an image, then edit the extracted text before saving it as a note.
              </Text>

              {loading ? (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator size="large" color="#14B8A6" />
                  <Text style={[styles.loadingText, { color: colors.subtext }]}>
                    Processing image...
                  </Text>
                </View>
              ) : (
                <View style={styles.sourceRow}>
                  <TouchableOpacity
                    onPress={async () => {
                      const permission = cameraPermission?.granted
                        ? cameraPermission
                        : await requestCameraPermission();

                      if (permission.granted) {
                        fadeTransition(() => setMode('camera'));
                      } else {
                        Alert.alert('Camera Permission', 'Camera access is required to scan documents.');
                      }
                    }}
                    style={[
                      styles.sourceCard,
                      {
                        backgroundColor: isDark ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.84)',
                        borderColor: hexAlpha('#14B8A6', 0.22),
                      },
                    ]}
                  >
                    <View style={[styles.sourceIcon, { backgroundColor: hexAlpha('#14B8A6', 0.14) }]}>
                      <Feather name="camera" size={26} color="#14B8A6" />
                    </View>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>Camera</Text>
                    <Text style={[styles.sourceSub, { color: colors.subtext }]}>Scan live</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGallery}
                    style={[
                      styles.sourceCard,
                      {
                        backgroundColor: isDark ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.84)',
                        borderColor: hexAlpha('#8B5CF6', 0.22),
                      },
                    ]}
                  >
                    <View style={[styles.sourceIcon, { backgroundColor: hexAlpha('#8B5CF6', 0.14) }]}>
                      <Feather name="image" size={26} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.sourceTitle, { color: colors.text }]}>Gallery</Text>
                    <Text style={[styles.sourceSub, { color: colors.subtext }]}>Upload image</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
          <BottomNavigation
            colors={colors}
            isDark={isDark}
            navigation={navigation}
            currentRoute="OCR"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (mode === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar barStyle="light-content" />
        <CameraView style={styles.flexOne} ref={cameraRef} facing="back">
          <SafeAreaView style={styles.flexOne}>
            <View style={styles.cameraTopBar}>
              <TouchableOpacity
                onPress={() => fadeTransition(() => setMode('home'))}
                style={styles.cameraBackBtn}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
                <Text style={styles.cameraBackText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.frameGuide}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            <Text style={styles.cameraHint}>Align the document inside the frame</Text>

            {loading ? (
              <View style={styles.cameraCapture}>
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
            ) : (
              <TouchableOpacity onPress={handleCapture} style={styles.cameraCapture}>
                <View style={styles.captureOuter}>
                  <View style={styles.captureInner} />
                </View>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <LinearGradient colors={getScreenGradient(isDark)} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Extracted Text"
          subtitle="Review and refine before saving"
          colors={colors}
          isDark={isDark}
          onBack={() => fadeTransition(() => setMode('home'))}
        />

        <Animated.View style={[styles.flexOne, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={styles.resultScroll}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            ) : null}

            <View
              style={[
                styles.textCard,
                {
                  backgroundColor: isDark ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.84)',
                  borderColor: hexAlpha(colors.text, 0.08),
                },
              ]}
            >
              <View style={styles.textMeta}>
                <Text style={[styles.metaLabel, { color: '#C9A84C' }]}>EXTRACTED TEXT</Text>
                <Text style={[styles.metaCount, { color: colors.subtext }]}>
                  {editableText.length} characters
                </Text>
              </View>
              <TextInput
                style={[styles.textResult, { color: colors.text }]}
                value={editableText}
                onChangeText={setEditableText}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View
            style={[
              styles.resultActions,
              {
                backgroundColor: isDark ? 'rgba(8,11,16,0.92)' : 'rgba(248,250,253,0.95)',
                borderTopColor: hexAlpha(colors.text, 0.08),
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.actionBtn, { borderColor: hexAlpha(colors.text, 0.08) }]}
            >
              <Feather name="copy" size={18} color={colors.text} />
              <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveAsNote}
              style={[styles.actionBtn, styles.actionBtnPrimary]}
            >
              <Feather name="save" size={18} color="#03120F" />
              <Text style={[styles.actionBtnLabel, { color: '#03120F' }]}>Save as Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => fadeTransition(() => setMode('home'))}
              style={[styles.actionBtn, { borderColor: hexAlpha(colors.text, 0.08) }]}
            >
              <Feather name="refresh-cw" size={18} color={colors.text} />
              <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Rescan</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <BottomNavigation
          colors={colors}
          isDark={isDark}
          navigation={navigation}
          currentRoute="OCR"
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: UI_SPACING.lg,
  },
  flexOne: { flex: 1 },
  heroBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  heroIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UI_SPACING.xl,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
    marginBottom: UI_SPACING.sm,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: UI_SPACING.xxl,
    maxWidth: 440,
  },
  loadingBlock: {
    alignItems: 'flex-start',
    gap: UI_SPACING.md,
  },
  loadingText: {
    fontSize: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: UI_SPACING.md,
  },
  sourceCard: {
    flex: 1,
    borderRadius: UI_RADIUS.md,
    borderWidth: 1,
    padding: UI_SPACING.xl,
  },
  sourceIcon: {
    width: 58,
    height: 58,
    borderRadius: UI_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: UI_SPACING.md,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sourceSub: {
    fontSize: 13,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraTopBar: {
    padding: UI_SPACING.lg,
  },
  cameraBackBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderRadius: UI_RADIUS.round,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  frameGuide: {
    flex: 1,
    marginHorizontal: 36,
    marginVertical: 48,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#14B8A6',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  cameraHint: {
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: UI_SPACING.md,
  },
  cameraCapture: {
    alignItems: 'center',
    paddingBottom: 42,
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  resultScroll: {
    paddingTop: UI_SPACING.lg,
    paddingBottom: 120,
  },
  previewImage: {
    width: '100%',
    height: 210,
    borderRadius: UI_RADIUS.md,
    marginBottom: UI_SPACING.lg,
    backgroundColor: '#000000',
  },
  textCard: {
    borderWidth: 1,
    borderRadius: UI_RADIUS.md,
    overflow: 'hidden',
  },
  textMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_SPACING.lg,
    paddingTop: UI_SPACING.lg,
  },
  metaLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  metaCount: {
    fontSize: 11,
  },
  textResult: {
    paddingHorizontal: UI_SPACING.lg,
    paddingTop: UI_SPACING.md,
    paddingBottom: UI_SPACING.xl,
    minHeight: 260,
    fontSize: 15,
    lineHeight: 24,
  },
  resultActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: UI_SPACING.sm,
    paddingHorizontal: UI_SPACING.lg,
    paddingTop: UI_SPACING.md,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: UI_RADIUS.round,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnPrimary: {
    backgroundColor: '#C9A84C',
    borderWidth: 0,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
