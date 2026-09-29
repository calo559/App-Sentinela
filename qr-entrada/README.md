# qr-entrada — Pantalla con el QR de la entrada

Página **independiente** (no necesita la app, ni internet, ni servidor) para
mostrar en una PC o TV en la entrada de la escuela. Muestra el **QR único**
que todos los alumnos escanean con la app Centinela. **El QR cambia solo cada hora.**

## Cómo usarla

1. Copiá esta carpeta a la PC/TV de la entrada (es portátil: funciona sola).
2. Doble clic en `index.html` → se abre en el navegador.
3. Tocá **F11** para pantalla completa.
4. Dejá la pestaña abierta y desactivá el "dormir" de la PC
   (Windows: Configuración → Sistema → Pantalla → "Apagar la pantalla" → *Nunca*).
5. Listo: la página sola renueva el QR en el cambio de hora y muestra la
   cuenta regresiva ("Cambia en mm:ss").

## Archivos

| Archivo       | Qué es |
|---------------|--------|
| `index.html`  | La página (se abre con doble clic). |
| `qr-core.js`  | Secreto y formato del QR. **Es el mismo archivo que usa la app** (`src/qr/qrDinamico.js` lo importa): si lo cambiás, cambia en los dos lados, sin sincronizar nada. |
| `qrcode.js`   | Librería para dibujar el QR (copiada de npm `qrcode-generator` v2.0.4, licencia MIT). |

## Qué valida la app al escanear

La seguridad no vive en esta página sino en la app del alumno:

1. **Firma** → QRs truchados o manipulados no pasan.
2. **Fecha** → solo sirve el QR del día.
3. **Hora (slot)** → el QR vence en el cambio de hora (5 min de gracia).
4. **Horario del curso** → como el QR es único para toda la escuela, la app
   valida que el curso del alumno tenga clase en ese momento
   (1ª / 2ª hora según `src/qr/horarios.js`).

## Notas

- Si cambiás el secreto o el formato, editá **`qr-core.js`** (lo comparte la
  app y esta página). Si copiaste la carpeta a otra PC, volvé a copiarla.
- Los horarios de la escuela (períodos, recreo, horario por curso) se
  configuran en **`src/qr/horarios.js`** dentro de la app.
- El secreto vive en el código porque no hay backend. Con servidor, la firma
  debería calcularse allá (HMAC).
