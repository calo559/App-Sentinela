// Host del diálogo global (ver src/utils/notify.js).
import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { subscribeNotify, closeNotify } from '../utils/notify';

export default function DialogHost() {
  const { colors } = useTheme();
  const [state, setState] = useState(null);

  useEffect(() => subscribeNotify(setState), []);

  if (!state || !state.visible) return null;

  const buttons = state.buttons && state.buttons.length ? state.buttons : [{ text: 'Cerrar' }];

  const handle = (b) => {
    closeNotify();
    if (typeof b?.onPress === 'function') b.onPress();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={closeNotify}>
      <View style={s.backdrop}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.text }]}>{state.title}</Text>
          {state.message ? (
            <Text style={[s.message, { color: colors.textSecondary }]}>{state.message}</Text>
          ) : null}

          <View style={s.row}>
            {buttons.map((b, i) => {
              const cancel = b.style === 'cancel' || b.style === 'destructive';
              return (
                <TouchableOpacity
                  key={`${b.text}-${i}`}
                  activeOpacity={0.8}
                  onPress={() => handle(b)}
                  style={[
                    s.btn,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                    !cancel && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      s.btnText,
                      { color: colors.textSecondary },
                      !cancel && { color: colors.onPrimary || '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {b.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  btn: {
    minWidth: 96,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: { fontSize: 14 },
});
