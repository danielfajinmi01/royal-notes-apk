import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getTodos, addTodo, toggleTodo, deleteTodo } from '../storage/storage';
import { hexAlpha } from '../utils/colorUtils';
import { animateLayout } from '../utils/animations';
import {
  UI_FONTS,
  UI_RADIUS,
  UI_SPACING,
  getScreenGradient,
} from '../theme/ui';
import { EmptyState, IconCircleButton, ScreenHeader } from '../components/ui';
import BottomNavigation from '../components/BottomNavigation';

function TodoItem({ item, onToggle, onDelete, colors, isDark }) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, slideAnim]);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.03, duration: 90, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onToggle(item.id);
  };

  const handleDelete = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onDelete(item.id));
  };

  return (
    <Animated.View
      style={[
        styles.todoItem,
        {
          backgroundColor: isDark ? 'rgba(17,17,17,0.72)' : 'rgba(255,255,255,0.82)',
          borderColor: item.completed ? hexAlpha('#14B8A6', 0.32) : hexAlpha(colors.text, 0.08),
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
        <View
          style={[
            styles.checkboxInner,
            {
              borderColor: item.completed ? '#14B8A6' : colors.subtext,
              backgroundColor: item.completed ? hexAlpha('#14B8A6', 0.2) : 'transparent',
            },
          ]}
        >
          {item.completed && <Feather name="check" size={14} color="#14B8A6" />}
        </View>
      </TouchableOpacity>

      <View style={styles.todoTextBlock}>
        <Text
          style={[
            styles.todoTitle,
            {
              color: item.completed ? colors.subtext : colors.text,
              textDecorationLine: item.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {item.title}
        </Text>
        {!!item.description && (
          <Text
            style={[
              styles.todoDesc,
              {
                color: hexAlpha(colors.subtext, 0.82),
                textDecorationLine: item.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
        <Feather name="x" size={18} color={hexAlpha(colors.subtext, 0.72)} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AddTaskModal({ visible, onClose, onAdd, colors, isDark }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (!title.trim()) {
      return;
    }
    onAdd(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: isDark ? '#101418' : '#FBFCFE',
              borderColor: hexAlpha(colors.text, 0.08),
            },
          ]}
        >
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Task</Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: hexAlpha(colors.text, 0.08),
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(13,27,42,0.03)',
              },
            ]}
            placeholder="Task title *"
            placeholderTextColor={hexAlpha(colors.subtext, 0.7)}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={[
              styles.input,
              styles.inputMulti,
              {
                color: colors.text,
                borderColor: hexAlpha(colors.text, 0.08),
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(13,27,42,0.03)',
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={hexAlpha(colors.subtext, 0.7)}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalBtn, { borderColor: hexAlpha(colors.text, 0.1) }]}
            >
              <Text style={{ color: colors.subtext, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.modalBtn, styles.addBtn, { backgroundColor: '#14B8A6' }]}
            >
              <Text style={{ color: '#031714', fontWeight: '700' }}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TodoScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [todos, setTodos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadTodos = async () => {
        const storedTodos = await getTodos();
        if (!isMounted) {
          return;
        }

        animateLayout('spring');
        setTodos(storedTodos);
      };

      loadTodos();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const completedCount = todos.filter(todo => todo.completed).length;
  const progress = todos.length > 0 ? completedCount / todos.length : 0;

  return (
    <LinearGradient colors={getScreenGradient(isDark)} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title="Tasks"
          subtitle={`${completedCount}/${todos.length} completed`}
          colors={colors}
          isDark={isDark}
          onBack={() => navigation.goBack()}
          rightAction={
            <IconCircleButton
              icon="plus"
              onPress={() => setModalVisible(true)}
              colors={colors}
              backgroundColor={hexAlpha('#14B8A6', 0.18)}
              color="#14B8A6"
            />
          }
        />

        {todos.length > 0 && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: hexAlpha(colors.text, 0.08) }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: '#14B8A6',
                    width: `${progress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.subtext }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        {todos.length === 0 ? (
          <EmptyState
            icon="check-square"
            title="Nothing pending"
            subtitle="Add a task to start building momentum"
            colors={colors}
            tint="#14B8A6"
          />
        ) : (
          <FlatList
            data={[...todos].sort((a, b) => Number(a.completed) - Number(b.completed))}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TodoItem
                item={item}
                colors={colors}
                isDark={isDark}
                onToggle={async id => {
                  animateLayout('spring');
                  const updated = await toggleTodo(id);
                  setTodos(updated);
                }}
                onDelete={async id => {
                  animateLayout('spring');
                  const updated = await deleteTodo(id);
                  setTodos(updated);
                }}
              />
            )}
          />
        )}

        <BottomNavigation
          colors={colors}
          isDark={isDark}
          navigation={navigation}
          currentRoute="Todo"
        />
      </SafeAreaView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
        isDark={isDark}
        onAdd={async (title, desc) => {
          animateLayout('spring');
          const updated = await addTodo(title, desc);
          setTodos(updated);
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: UI_SPACING.lg,
    paddingBottom: UI_SPACING.lg,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_SPACING.md,
    marginTop: UI_SPACING.lg,
    marginBottom: UI_SPACING.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: UI_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: UI_RADIUS.round,
  },
  progressText: {
    width: 42,
    textAlign: 'right',
    fontSize: 12,
  },
  list: {
    paddingTop: UI_SPACING.sm,
    paddingBottom: UI_SPACING.xxxl,
    gap: UI_SPACING.md,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: UI_RADIUS.md,
    borderWidth: 1,
    padding: UI_SPACING.lg,
  },
  checkbox: {
    marginRight: UI_SPACING.md,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: UI_RADIUS.round,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoTextBlock: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  todoDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  deleteBtn: {
    paddingLeft: UI_SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  modalSheet: {
    borderTopLeftRadius: UI_RADIUS.xl,
    borderTopRightRadius: UI_RADIUS.xl,
    borderWidth: 1,
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: UI_FONTS.serif,
    marginBottom: UI_SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: UI_RADIUS.md,
    padding: 14,
    fontSize: 15,
    marginBottom: UI_SPACING.md,
  },
  inputMulti: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: UI_SPACING.md,
    marginTop: UI_SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: UI_RADIUS.round,
    alignItems: 'center',
    borderWidth: 1,
  },
  addBtn: {
    borderWidth: 0,
  },
});
