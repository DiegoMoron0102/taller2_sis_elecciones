# Guión del Moderador — Pruebas de Usabilidad

**Sistema:** VotoSeguro — Sistema de Votación Electrónica Descentralizada  
**Autor:** Diego Morón Mejía — UCB San Pablo  
**Versión evaluada:** Sprint 0/1/2 (prototipo funcional local)

---

## Objetivo de la sesión

Evaluar la facilidad de uso del flujo de votación en el prototipo actual, identificando barreras de comprensión y usabilidad antes de la defensa.

---

## Perfil del participante

- Ciudadano con acceso a dispositivos digitales básicos.
- Puede o no tener experiencia previa con sistemas de votación digital.
- No es necesario conocimiento técnico en blockchain o criptografía.
- Rango de edad: 18–65 años.

---

## Materiales necesarios

- Computadora con el prototipo corriendo localmente (`localhost:3000`).
- Formulario CSV de registro (`DATOS_USABILIDAD.csv`) impreso o digital.
- Cronómetro.
- Cuaderno de observaciones del moderador.

---

## Instrucciones para el moderador

1. **Presentación (2 min):** Presentarse y explicar que se evalúa el sistema, no al participante.
2. **Consentimiento (1 min):** Explicar que los datos son anónimos y para uso académico.
3. **Pensamiento en voz alta:** Pedir al participante que verbalice lo que piensa mientras usa el sistema.
4. **Sin asistencia activa:** No responder preguntas del participante sobre cómo usar el sistema durante las tareas. Tomar nota.
5. **Registrar:** Tiempo, éxito, número de errores y comentarios literales.
6. **Entrevista posterior (5 min):** Aplicar las preguntas de cierre.

---

## Tareas del escenario

### Tarea 1 — Entender el sistema (Landing page)
**Instrucción al participante:**  
*"Acaba de entrar a esta página. Dígame qué entiende sobre para qué sirve este sistema y cómo comenzaría a votar."*

- **Criterio de éxito:** Menciona votar / verificar credencial antes de 90 segundos.
- **Medir:** tiempo de comprensión, palabras clave identificadas.

---

### Tarea 2 — Verificar credencial (`/verificar`)
**Instrucción al participante:**  
*"Ahora intente autenticarse. Utilice estos datos de prueba: Padrón: LP123456, Nombre: Juan Lopez, CI: 12345678L."*

- **Criterio de éxito:** Completa el formulario y presiona el botón correctamente.
- **Medir:** tiempo, cantidad de intentos fallidos, errores en campos.

---

### Tarea 3 — Emitir voto (`/votar`)
**Instrucción al participante:**  
*"Ahora seleccione al candidato de su preferencia y emita su voto."*

- **Criterio de éxito:** Selecciona candidato y hace clic en "Emitir voto".
- **Medir:** tiempo, candidato seleccionado (para verificar comprensión), confusión observable.

---

### Tarea 4 — Verificar su voto (`/explorer`)
**Instrucción al participante:**  
*"¿Puede ver si su voto quedó registrado en el sistema? Intente encontrarlo."*

- **Criterio de éxito:** Navega al Explorer y comprende la tabla de boletas.
- **Medir:** tiempo, si necesita ayuda para navegar.

---

## Preguntas de cierre (escala 1–5)

1. ¿Qué tan fácil fue entender el propósito del sistema? (1=muy difícil, 5=muy fácil)
2. ¿Qué tan fácil fue completar el proceso de votación? (1=muy difícil, 5=muy fácil)
3. ¿Qué tan confiable le pareció el sistema? (1=nada confiable, 5=muy confiable)
4. ¿Qué cambiaría en la interfaz?
5. ¿Usaría este sistema si fuera un sistema oficial de votación?

---

## Criterios de aceptación mínimos

| Indicador | Objetivo |
|---|---|
| Tasa de éxito por tarea | ≥ 80% de participantes |
| Tiempo total del flujo (T2+T3+T4) | ≤ 3 minutos |
| Satisfacción media (preguntas 1–3) | ≥ 4.0 / 5.0 |
| Errores críticos (impiden completar tarea) | 0 en T3 |

---

## Registro post-sesión

Completar inmediatamente después de cada sesión el archivo `DATOS_USABILIDAD.csv` con los valores registrados.
