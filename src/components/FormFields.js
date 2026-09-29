// Campos de formulario compartidos por Login y Registro.
// Definidos a nivel de módulo: si se declaran dentro del componente, React los
// remonta en cada render y el TextInput pierde el foco (bug del teclado).
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Paleta de la tarjeta clara (la card del login/registro es "papel" en ambos temas)
export const formStyles = StyleSheet.create({
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A6B80',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderWidth: 1.5,
    borderColor: '#E4EAF3',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  fieldBoxFocused: { borderColor: '#00C9DB', backgroundColor: '#FFFFFF' },
  fieldBoxError: { borderColor: '#D32F2F' },
  fieldInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0B1628',
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineStyle: 'none', // web: sin borde azul del navegador
  },
  fieldError: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 5,
    marginLeft: 2,
  },
  eyeButton: { padding: 6, marginLeft: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsHint: { fontSize: 13, color: '#8494AB', fontStyle: 'italic', paddingVertical: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4EAF3',
    backgroundColor: '#F4F7FB',
  },
  chipActive: { borderColor: '#00C9DB', backgroundColor: 'rgba(0,201,219,0.14)' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#5A6B80' },
  chipTextActive: { color: '#0B1628' },
});

export function InputField({
  icon,
  label,
  value,
  onChangeText,
  errorKey,
  errors,
  setErrors,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const error = errors[errorKey];
  return (
    <View style={formStyles.fieldGroup}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      <View
        style={[
          formStyles.fieldBox,
          focused && formStyles.fieldBoxFocused,
          error && formStyles.fieldBoxError,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={focused ? '#00C9DB' : '#8494AB'}
        />
        <TextInput
          style={formStyles.fieldInput}
          placeholderTextColor="#9AA5B1"
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error ? <Text style={formStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function PasswordField({
  label,
  value,
  onChangeText,
  errorKey,
  errors,
  setErrors,
  showPassword,
  onToggleShow,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const error = errors[errorKey];
  return (
    <View style={formStyles.fieldGroup}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      <View
        style={[
          formStyles.fieldBox,
          focused && formStyles.fieldBoxFocused,
          error && formStyles.fieldBoxError,
        ]}
      >
        <MaterialCommunityIcons
          name="lock-outline"
          size={18}
          color={focused ? '#00C9DB' : '#8494AB'}
        />
        <TextInput
          style={formStyles.fieldInput}
          placeholderTextColor="#9AA5B1"
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            setErrors((prev) => ({ ...prev, [errorKey]: '' }));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={!showPassword}
          {...props}
        />
        <TouchableOpacity style={formStyles.eyeButton} onPress={onToggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={focused ? '#00C9DB' : '#8494AB'}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={formStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function MultiChips({ label, options, value, onToggle, errorKey, errors, setErrors, display }) {
  const error = errors[errorKey];
  return (
    <View style={formStyles.fieldGroup}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      {options.length === 0 ? (
        <Text style={formStyles.chipsHint}>Elegí primero el año para ver las materias</Text>
      ) : (
        <View style={formStyles.chipsRow}>
          {options.map((opt) => {
            const active = value.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onToggle(opt);
                  setErrors((prev) => ({ ...prev, [errorKey]: '' }));
                }}
                style={[formStyles.chip, active && formStyles.chipActive]}
              >
                <Text style={[formStyles.chipText, active && formStyles.chipTextActive]}>
                  {display ? display(opt) : opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {error ? <Text style={formStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Selección de opciones en chips (curso / división)
export function SelectChips({ label, options, value, onSelect, errorKey, errors, setErrors, display }) {
  const error = errors[errorKey];
  return (
    <View style={formStyles.fieldGroup}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      <View style={formStyles.chipsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => {
              onSelect(opt);
              setErrors((prev) => ({ ...prev, [errorKey]: '' }));
            }}
            style={[formStyles.chip, value === opt && formStyles.chipActive]}
          >
            <Text style={[formStyles.chipText, value === opt && formStyles.chipTextActive]}>
              {display ? display(opt) : opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={formStyles.fieldError}>{error}</Text> : null}
    </View>
  );
}
