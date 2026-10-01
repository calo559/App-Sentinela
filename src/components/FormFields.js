import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const optionKey = (option) => (option && typeof option === 'object' ? option.id : option);

const optionText = (option, render) => {
  if (render) return render(option);
  if (option && typeof option === 'object') return option.label ?? option.nombre ?? String(option.id);
  return String(option);
};

const buildStyles = (colors) =>
  StyleSheet.create({
    group: { marginBottom: 14 },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 6,
      marginLeft: 2,
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      minHeight: 50,
    },
    boxFocused: { borderColor: colors.primary },
    boxError: { borderColor: colors.error },
    boxMultiline: { alignItems: 'flex-start', paddingVertical: 10 },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: 'transparent',
      borderWidth: 0,
      outlineStyle: 'none',
    },
    inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
    error: { fontSize: 12, color: colors.error, marginTop: 5, marginLeft: 2 },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 5, marginLeft: 2 },
    eyeButton: { padding: 6, marginLeft: 4 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipsEmpty: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', paddingVertical: 6 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceVariant,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.surface },
    chipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    chipTextActive: { color: colors.primary },
  });

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => buildStyles(colors), [colors]);
}

export function InputField({
  label,
  icon,
  value,
  onChangeText,
  error,
  hint,
  multiline = false,
  onFocus,
  onBlur,
  ...props
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.group}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <View
        style={[
          s.box,
          multiline && s.boxMultiline,
          focused && s.boxFocused,
          error ? s.boxError : null,
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons name={icon} size={18} color={focused ? colors.primary : colors.textSecondary} />
        ) : null}
        <TextInput
          {...props}
          style={[s.input, multiline ? s.inputMultiline : null]}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {!error && hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function PasswordField({ label, icon = 'lock-outline', value, onChangeText, error, hint, onFocus, onBlur, ...props }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const iconColor = focused ? colors.primary : colors.textSecondary;

  return (
    <View style={s.group}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <View style={[s.box, focused && s.boxFocused, error ? s.boxError : null]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
        <TextInput
          {...props}
          style={s.input}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        <TouchableOpacity
          style={s.eyeButton}
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={iconColor} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}
      {!error && hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function SelectChips({ label, options = [], value, onSelect, renderItem, emptyText, error, hint }) {
  const s = useStyles();

  if (!options.length) {
    return emptyText ? (
      <View style={s.group}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <Text style={s.chipsEmpty}>{emptyText}</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    ) : null;
  }

  return (
    <View style={s.group}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.chipsRow}>
        {options.map((option) => {
          const active = value === optionKey(option);
          return (
            <TouchableOpacity
              key={String(optionKey(option))}
              activeOpacity={0.75}
              onPress={() => onSelect(optionKey(option))}
              style={[s.chip, active && s.chipActive]}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{optionText(option, renderItem)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!error && hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function MultiChips({ label, options = [], values = [], onToggle, renderItem, emptyText, error, hint }) {
  const s = useStyles();

  if (!options.length) {
    return emptyText ? (
      <View style={s.group}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <Text style={s.chipsEmpty}>{emptyText}</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    ) : null;
  }

  return (
    <View style={s.group}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.chipsRow}>
        {options.map((option) => {
          const key = optionKey(option);
          const active = values.includes(key);
          return (
            <TouchableOpacity
              key={String(key)}
              activeOpacity={0.75}
              onPress={() => onToggle(key)}
              style={[s.chip, active && s.chipActive]}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{optionText(option, renderItem)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!error && hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}
