# Correcciones, Mejoras y Pendientes para VotoSeguro

## Objetivo

Realizar una última ronda de correcciones y mejoras al sistema **VotoSeguro** para la presentación final del proyecto y validación de funcionalidades.

---

# 1. Corrección: Carga de Imagen de la Elección

## Problema

Actualmente no está funcionando la carga de imagen dentro de la configuración de una elección en el módulo **Administrador**.

## Comportamiento esperado

* El administrador debe poder seleccionar una imagen.
* La imagen debe almacenarse correctamente.
* La imagen debe visualizarse posteriormente en:

  * Información de la elección.
  * Pantalla de votación.
  * Resultados (si corresponde).

## Verificaciones requeridas

* Revisar endpoint de subida de archivos.
* Revisar almacenamiento local o persistencia.
* Revisar renderizado de la imagen en frontend.
* Validar formatos permitidos:

  * PNG
  * JPG
  * JPEG

---

# 2. Nueva Funcionalidad: Reiniciar Configuración de Elección

## Problema

Las elecciones nuevas conservan información de elecciones anteriores:

* Electores registrados.
* Candidatos.
* Configuración residual.

Esto dificulta realizar demostraciones limpias.

## Requerimiento

Agregar un botón:

### "Reiniciar Elección"

Al ejecutarse deberá:

* Eliminar candidatos registrados.
* Eliminar electores registrados.
* Eliminar credenciales emitidas.
* Eliminar votos almacenados.
* Eliminar resultados previos.
* Eliminar configuración residual.

## Consideraciones

* Solicitar confirmación antes de ejecutar.
* Mostrar advertencia de acción irreversible.
* Dejar el sistema en estado inicial listo para una nueva elección.

---

# 3. Mejora: Verificación Inicial de Credenciales

## Problema

Actualmente la verificación requiere pegar manualmente el contenido completo del VC.

Esto no es práctico para el usuario.

## Requerimiento

Agregar dos modalidades de verificación:

### Opción 1: Pegar VC

Mantener la funcionalidad actual mediante un cuadro de texto.

### Opción 2: Adjuntar Archivo JSON

Agregar un selector de archivos que permita:

* Seleccionar un archivo `.json`
* Leer automáticamente el contenido
* Ejecutar la validación del VC

## Flujo esperado

Usuario:

1. Pega el VC completo

o

2. Adjunta el archivo JSON

↓

Sistema valida

↓

Muestra resultado de verificación

---

# 4. Mejora Visual: Centrado de Candidatos

## Problema

Las tarjetas/opciones de candidatos aparecen alineadas a la izquierda.

Visualmente no resulta adecuado para la presentación.

## Requerimiento

Centrar horizontalmente:

* Tarjetas de candidatos.
* Fotografías.
* Nombre.
* Partido o agrupación.

## Resultado esperado

Una distribución visual equilibrada independientemente del número de candidatos.

---

# 5. Generar UML y Cronograma del Proyecto

## Requerimiento

Generar un diagrama UML que represente la planificación y ejecución del proyecto junto con un diagrama tipo Gantt.

## Fases sugeridas

### Fase 1: Investigación

* Estado del arte
* Votación electrónica
* SSI
* Verifiable Credentials
* Blockchain

Duración: 4 semanas

### Fase 2: Diseño

* Arquitectura del sistema
* Casos de uso
* Modelado UML
* Diseño criptográfico

Duración: 3 semanas

### Fase 3: Desarrollo Backend

* Gestión de elecciones
* Gestión de credenciales
* Blockchain
* APIs

Duración: 6 semanas

### Fase 4: Desarrollo Frontend

* Panel administrador
* Registro de electores
* Interfaz de votación
* Verificación

Duración: 5 semanas

### Fase 5: Integración

* SSI + VC
* Blockchain
* Flujo completo de votación

Duración: 3 semanas

### Fase 6: Pruebas

* Pruebas funcionales
* Pruebas criptográficas
* Validación E2E

Duración: 3 semanas

### Fase 7: Documentación y Defensa

* Memoria técnica
* Artículo
* Presentación final

Duración: 2 semanas

---

# 6. Consulta Técnica sobre Blockchain

## Pregunta

Necesito confirmar cómo se está almacenando la información en blockchain.

### Opción A: Registro individual

Cada voto genera una transacción independiente.

Ventajas:

* Máxima auditabilidad.

Desventajas:

* Puede aumentar riesgos de correlación temporal.
* Mayor costo computacional.

### Opción B: Registro por lotes (Batch)

Los votos se agrupan.

Posteriormente se registra:

* Un Merkle Root.
* Un hash agregado.
* Un bloque resumen.

Ventajas:

* Reduce trazabilidad temporal.
* Mejora privacidad.
* Menor costo.
* Más escalable.

## Solicitud

Analizar la implementación actual y responder:

1. ¿Los votos se registran individualmente o por lotes?
2. ¿Existe riesgo de correlación entre voto y votante?
3. ¿Qué mecanismos de anonimización se están utilizando?
4. ¿La implementación actual cumple con el principio de secreto del voto?
5. ¿Qué mejoras serían recomendables para fortalecer la privacidad?
6. En caso de registrar votos individualmente, evaluar migración a un esquema basado en Merkle Trees y almacenamiento por batches.

---

# Prioridad de Implementación

## Alta

1. Corregir carga de imagen de elección.
2. Implementar reinicio completo de elección.
3. Verificación mediante archivo JSON.

## Media

4. Centrado visual de candidatos.

## Baja

5. UML y Gantt actualizados.
6. Revisión de estrategia de almacenamiento en blockchain.
