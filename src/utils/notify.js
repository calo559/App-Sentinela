// Mensajes y confirmaciones.
// En react-native-web `Alert.alert` es un no-op (no muestra nada ni ejecuta
// los botones), así que usamos un diálogo global con la misma firma:
//   notify('Título', 'Mensaje', [{ text: 'OK', onPress } , { text: 'Cancelar', style: 'cancel' }])
// Lo renderiza <DialogHost /> (montado en App.js).

let listener = null;
let state = { visible: false, title: '', message: '', buttons: null };

function emit() {
  if (listener) listener(state);
}

export function notify(title = '', message = '', buttons = null) {
  state = {
    visible: true,
    title: String(title),
    message: message == null ? '' : String(message),
    buttons: Array.isArray(buttons) && buttons.length ? buttons : null,
  };
  emit();
}

export function closeNotify() {
  if (!state.visible) return;
  state = { ...state, visible: false };
  emit();
}

export function subscribeNotify(fn) {
  listener = fn;
  fn(state);
  return () => {
    if (listener === fn) listener = null;
  };
}
