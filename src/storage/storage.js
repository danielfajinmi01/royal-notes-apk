import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = '@royal_notes_v1';
const TODOS_KEY = '@royal_todos_v1';
const SCRATCHPAD_KEY = '@royal_scratchpad_v1';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeNote(note) {
  return {
    ...note,
    tags: Array.isArray(note.tags) ? note.tags : [],
    isFavorite: Boolean(note.isFavorite),
    bgColor: note.bgColor ?? null,
    wallpaperUri: note.wallpaperUri ?? null,
  };
}

export async function getNotes() {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw).map(normalizeNote) : [];
  } catch {
    return [];
  }
}

export async function saveNote(note) {
  try {
    const notes = await getNotes();
    const now = Date.now();
    const nextNote = normalizeNote(note);

    if (nextNote.id) {
      const index = notes.findIndex(n => n.id === nextNote.id);
      if (index > -1) {
        notes[index] = normalizeNote({ ...notes[index], ...nextNote, updatedAt: now });
      } else {
        notes.unshift(normalizeNote({ ...nextNote, updatedAt: now, createdAt: now }));
      }
    } else {
      notes.unshift(normalizeNote({ ...nextNote, id: uuid(), createdAt: now, updatedAt: now }));
    }

    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return notes;
  } catch (e) {
    console.error('saveNote error:', e);
    return [];
  }
}

export async function deleteNote(id) {
  try {
    const notes = await getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export async function toggleNoteFavorite(id) {
  try {
    const notes = await getNotes();
    const updated = notes.map(note =>
      note.id === id ? { ...note, isFavorite: !note.isFavorite, updatedAt: Date.now() } : note
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function getTodos() {
  try {
    const raw = await AsyncStorage.getItem(TODOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTodos(todos) {
  try {
    await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('saveTodos error:', e);
  }
}

export async function addTodo(title, description = '') {
  try {
    const todos = await getTodos();
    const newTodo = {
      id: uuid(),
      title,
      description,
      completed: false,
      createdAt: Date.now(),
      order: todos.length,
    };
    const updated = [newTodo, ...todos];
    await saveTodos(updated);
    return updated;
  } catch {
    return [];
  }
}

export async function toggleTodo(id) {
  try {
    const todos = await getTodos();
    const updated = todos.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
    await saveTodos(updated);
    return updated;
  } catch {
    return [];
  }
}

export async function deleteTodo(id) {
  try {
    const todos = await getTodos();
    const updated = todos.filter(t => t.id !== id);
    await saveTodos(updated);
    return updated;
  } catch {
    return [];
  }
}

export async function getScratchpad() {
  try {
    return (await AsyncStorage.getItem(SCRATCHPAD_KEY)) || '';
  } catch {
    return '';
  }
}

export async function saveScratchpad(value) {
  try {
    await AsyncStorage.setItem(SCRATCHPAD_KEY, value);
  } catch (e) {
    console.error('saveScratchpad error:', e);
  }
}
