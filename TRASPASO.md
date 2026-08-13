# Traspaso — App de Proyectos (Como Sentirse Bien)

Documento para adjuntar al iniciar un chat nuevo, junto con `DESIGN.md` y el `index.html`.

## Qué es esto

App de organización personal y de negocio para Miguel Morales. Nace del motor de DEKA Trainer
reutilizando su arquitectura, pero con dominio y aspecto completamente distintos.

**Estado actual: v4.** v1 fueron proyectos sueltos. v2 añadió la dirección —áreas puntuadas,
ciclos de doce semanas, objetivos—. v3 bajó al día: plan diario, temporizador y diario estoico.
**v4 no añade módulos: hace que los que ya había hablen entre sí.**

La app dejó de ser «una herramienta para organizar proyectos» y pasó a ser otra cosa:

> **Una herramienta para comprobar si dedicas tu tiempo a lo que dices que importa.**

Ese cambio de tesis es lo que manda ahora en cualquier decisión de producto. Si una función no
ayuda a responder esa pregunta, no entra.

## La idea que sostiene el sistema

Tres piezas que se apoyan entre sí:

1. **Evaluar por áreas.** Ocho dominios de vida y negocio con una nota del 1 al 10, actual y
   deseada, más un **reparto declarado**: qué porcentaje de tu tiempo dices que merece cada una.
   La nota dice dónde estás; el reparto es contra lo que se contrasta la realidad.
2. **Trabajar en ciclos de doce semanas.** Uno a tres objetivos por ciclo, ni uno más. El año es
   un horizonte demasiado ancho para generar urgencia; doce semanas sí.
3. **Ejecutar con revisión.** Diaria, semanal, mensual y de cierre de ciclo. Sin revisión el
   sistema es una lista muerta.

La jerarquía es: **área → objetivo del ciclo → proyecto → hito / pendiente → tarea del día**. Un
proyecto que no empuja ningún objetivo puede existir (trabajo de fondo), pero se ve distinto.

El día es donde el sistema toca el suelo. Por eso **Hoy es la pestaña de entrada**: al abrir la
app no ves la estrategia, ves lo que toca ahora.

Y el **Panel es el cerebro**: no resume lo que hay, responde a la pregunta de la tesis. En diez
segundos: en qué semana del ciclo estás, a dónde fue tu tiempo, qué objetivos se mueven, qué
proyectos piden una decisión, y una lectura en una frase.

### La regla que gobierna el Panel

**Por debajo de dos horas registradas en la semana (`MIN_DATO`), la app no diagnostica.** Dice que
hay poco dato y se calla. Un veredicto sobre la vida de alguien calculado con tres pomodoros sería
exactamente el problema que esta versión intenta resolver. Lo mismo en la revisión: sin dato, no
hay observaciones. Y nunca más de tres a la vez, porque una lista larga se lee como una regañina.

### El límite honesto del registro

La app **no ve tu tiempo: ve el que anotaste.** El temporizador sale natural en trabajo de
escritorio y ridículo al salir a correr o al comer con los tuyos, así que sin corrección el reparto
por áreas quedaría sesgado hacia lo que haces sentado — y un número con aspecto de dato objetivo
te empujaría a conclusiones falsas sobre tu vida.

De ahí la **imputación manual**: un «+ min» en cualquier tarea, y en el cierre del día una pregunta
por las que diste por hechas sin tiempo. Y de ahí que todo el copy diga «tiempo registrado», nunca
«tu tiempo». Si alguna vez alguien lo cambia por lo segundo, está mintiendo al usuario.

## Restricción principal

Toda decisión visual sale de `DESIGN.md` v1.0. No improvisar estilo. Los errores típicos que hay
que evitar, porque el documento los prohíbe explícitamente:

* Fondo blanco puro → siempre crema `#FAF5EF` (§2.6.5). Negro puro tampoco (§2.6.6)
* Emojis en la interfaz → iconografía lineal SVG, trazo 1.5, sin rellenos (§7)
* Oro `#A18039` en texto pequeño → usar `#7D6428`. Sobre fondo oscuro, `#C4A96B` (§2.6.2-3)
* Taupe `#9E8D77` como texto → es decorativo y solo decorativo (§2.6.4)
* Sombras (salvo la del modal), degradados, radios >16 px en superficies (§6, §7)
* Rampas multicolor en escalas → un solo tono; la comparación la hace la forma (§4.3)
* Objetivos táctiles por debajo de 48 × 48 px (§8)
* Botones de más de tres palabras o sin verbo delante (§12)
* Aspecto de «app de fitness» o «dashboard de startup» — la referencia es editorial

### El ámbar no se usa en esta app

`#F9BC60` es **color de conversión** (§2.4: «solo botones y enlaces de conversión, nunca
decorativo»; §4.1: «comprar, apuntarse, empezar»). Esta app no vende nada: sus acciones son
guardar, crear y continuar, que §4.1 asigna al **primario verde bosque**. En la tabla del §11 el
ámbar es «No» para todo lo que no sea página de venta, bloque de suscripción o email.

Por eso los tokens `--accion*` **no están definidos** en el `:root`, para que nadie los alcance
por accidente. Si algún día la app incorpora una pantalla de conversión, se añaden ahí y solo ahí.

### Desvío consciente y único

`§4.4` pide una cabecera de 80 px. En móvil se queda en 64 y desde 640 px sube a 80. Con la fila
de pestañas debajo, 80 dejaría 128 px fijos —casi un quinto de la pantalla de un teléfono— y §5
antepone el aire al resto. Está comentado en el CSS junto a la regla.

`prueba.js` comprueba automáticamente todas las reglas que se pueden verificar leyendo el archivo.

## Arquitectura

Un solo archivo `index.html`, sin dependencias ni build. Se sirve desde GitHub Pages y se instala
como PWA desde Safari (Compartir → Añadir a pantalla de inicio).

```
CSS   tokens (§2 DESIGN.md) → tipografía (§3) → layout (§5)
      → componentes (§4) → profundidad (§6)
JS    1. Estado, migración y persistencia   localStorage, clave csb-proyectos-v1
      2. Utilidades                         h(), esc(), fechas, modal(), avisar(), rampa()
      3. Modelo de dominio                  progreso(), cicloActivo(), puntObjetiva()
         └ motor de tiempo                  repartoTiempo(), diceYHace(), lecturaSemana()
      4. Pantallas                          Hoy · Panel · Ciclo · Proyectos · Áreas · Revisión
      5. Overlays                           detalle, edición, planificación, ajustes
      6. Temporizador                       fases, aviso sonoro, pantalla despierta
      7. Gráficas                           evolución del % y rueda de áreas
      8. Arranque                           pintar() + refrescarReloj()
```

Patrones heredados de DEKA que conviene mantener:

* `h(html)` devuelve un fragmento si hay varios elementos raíz (si devolviera solo el primero, se
  perderían bloques — fue un bug real).
* Render completo en cada cambio: `pintar()`. Sin framework, sin estado reactivo. A esta escala
  funciona bien y es fácil de razonar.
* Persistencia inmediata: cada mutación llama a `guardar()`.
* Copia de seguridad como JSON copiable en Ajustes. Imprescindible antes de cualquier cambio de
  dominio.

Añadidos en v2:

* `normalizar()` rellena huecos sin pisar lo que ya existe — el estado sobrevive a datos parciales
  o corruptos.
* `migrar()` sube de v1 a v2 sin pérdida. De v2 a v3 no hizo falta tramo propio: v3 solo añade
  claves nuevas y de eso ya se encarga `normalizar()`. Cualquier cambio futuro sigue el mismo
  patrón: subir `VERSION` y, si hay que transformar datos y no solo añadirlos, un tramo en
  `migrar()`.
* Los ids se referencian siempre por `areaId` / `objetivoId` / `cicloId`, nunca por nombre.

## Modelo de datos

```js
S = {
  areas:      [area], ciclos: [ciclo], objetivos: [objetivo],
  proyectos:  [proyecto], revisiones: [revision], dias: [dia],
  focos:       {fecha, ids:[proyectoId]},       // 1-3, vigentes 7 días
  temporizador: temporizador | null,
  ajustes:     {nombre, diasSinTocar, avisoFecha, sonido,
                pomodoro:{trabajo, pausa, pausaLarga, rondas}},
  _v: 4
}

area = {
  id, nombre, tipo: "personal" | "negocio",
  actual, deseada,              // 1-10, o null si sin puntuar
  reparto,                      // % del tiempo que dices que merece · null si no compite
  indicador, motivo, accion,    // accion = hábito semanal asociado
  revisado,                     // ISO
  historia: [{fecha, actual}]
}

ciclo = {
  id, nombre, inicio, fin,      // fin = inicio + 12 semanas - 1 día
  estado: "activo" | "cerrado",
  cierre: {fecha, aprendizajes} | null
}

objetivo = {
  id, nombre, areaId, cicloId,
  estado: "activo" | "logrado" | "soltado",
  porQue, resultado, metrica, riesgos,
  prioridad: "alta" | "media" | "baja",
  creado
}

proyecto = {
  id, nombre, areaId, objetivoId,          // objetivoId null = trabajo de fondo
  estado: "activo" | "pausado" | "completado",
  archivado,                                // fuera de la vista, no borrado
  desc,
  modo: "hitos" | "manual",                 // cómo se calcula el %
  pct,                                      // solo si modo === "manual"
  para,                                     // fecha objetivo ISO, opcional
  hitos:      [{id, texto, hecho}],
  pendientes: [{id, texto, hecho, para}],
  minutos,                                  // total cronometrado, en minutos
  creado, tocado,
  historia:   [{fecha, pct}]                // un registro por día tocado
}

dia = {
  fecha,                                    // ISO, clave del registro
  manana: {dificultades, control, intencion, hechoEn} | null,
  tareas: [tarea],
  noche:  {torcio, bien, cambio, hechoEn} | null,
  sueltos,                                  // minutos cronometrados sin tarea enfocada
  punt,                                     // 1-10 subjetiva, la pones tú
  cerrado
}

tarea = {
  id, texto,
  min,                                      // duración prevista
  real,                                     // minutos cronometrados
  hecho,
  proyectoId, pendienteId, areaId           // de dónde viene; null si es suelta
}

temporizador = {
  fase: "trabajo" | "pausa" | "pausaLarga",
  ronda, tareaId,
  inicio, desde, trabajado,                 // ver §6 del index.html
  fin,                                      // MARCA DE TIEMPO, no un contador
  enPausa, restante, agotada
}

revision = {
  id, tipo: "semanal" | "mensual" | "cierre", fecha, cicloId,
  funciono, noFunciono, bloqueos, decisiones,
  focos: [proyectoId], puntuacion            // 1-10, solo semanal
}
```

Fuentes de verdad, una por nivel:

* `progreso(p)` — el % del proyecto. Si el modo es hitos, lo calcula; si es manual, devuelve
  `pct`; si está completado, 100.
* `progresoObjetivo(o)` — media de sus proyectos vivos. `null` si no tiene ninguno, y así se
  muestra: un objetivo sin proyectos es un deseo, no un avance del 0 %.
* `avanceCiclo(c)` — media de sus objetivos no soltados.
* `puntObjetiva(d)` — nota del día del 1 al 10, ponderada por minutos previstos: cerrar la tarea
  de dos horas no vale lo mismo que cerrar la de diez minutos. Sin minutos, cuenta tareas.
* `trabajadoHasta(t)` — tiempo con el reloj corriendo, topado en el fin de la fase.

### El motor de tiempo

`proyecto.minutos` es un total sin fecha y **no sirve para «esta semana»**. La verdad temporal vive
en `S.dias`: cada tarea guarda sus minutos reales y de dónde viene. Todo se reconstruye desde ahí.

* `diasEntre(desde,hasta)` y `ultimos(n)` — el rango.
* `destinoTarea(t)` — `objetivo` si su proyecto empuja uno, `fondo` si no, `area` si es una acción
  semanal, `suelta` si no cuelga de nada.
* `repartoTiempo(ds)` — minutos por destino, más `sinTarea` (cronometrado sin tarea enfocada).
* `tiempoPorArea` · `tiempoProyecto` · `tiempoObjetivo` · `actividad(p)` — los cortes.
* `repartoDeseado()` — el reparto declarado, normalizado a 100. **`null` si no has declarado
  ninguno**, y entonces la comparación se desactiva sola en vez de inventarse un deseado.
* `diceYHace(ds)` — las dos series, ordenadas **por desajuste**, no por volumen.
* `tendenciaObjetivo(o)` — puntos ganados en siete días, para las flechas ↑ → ↓.
* `lecturaSemana()` — la frase del Panel, por reglas y en orden de prioridad.
* `loQueLlamaLaAtencion(ds,rt)` — hasta tres observaciones para la revisión.

## Qué ya funciona

**Hoy** — la pestaña de entrada, en tres tramos:

* *Antes de empezar.* Premeditatio malorum en tres preguntas: qué puede torcerse, qué de eso
  depende de ti, cómo quieres haber actuado esta noche. No busca agorerismo, busca que lo difícil
  no te pille de nuevas.
* *El plan.* Tareas del día con duración prevista y minutos reales. Se añaden a mano o desde las
  sugerencias (pendientes con la fecha encima o pasada, y las acciones semanales de cada área).
  Nada entra solo. Marcar una tarea que venía de un proyecto cierra también su pendiente.
* *Al cerrar.* Examen en tres preguntas y una nota subjetiva del día. Al lado, la nota objetiva
  calculada. Si se separan tres puntos o más, la app lo dice.

Debajo, el historial de días con sus dos notas y el detalle de cada entrada.

**Temporizador** — dentro de Hoy, en tarjeta verde. Ciclos configurables con tres preajustes
(25/5, 50/10, 90/20) o a medida. Enfocas una tarea y el tiempo se le anota a ella y a su proyecto.
Aviso sonoro generado al vuelo, sin archivos externos. Ver la sección §6 del `index.html` para los
detalles y sus límites.

**Panel** — ciclo en curso con semana X de 12, avance frente a tiempo transcurrido (si el tiempo
va más de 20 puntos por delante, lo dice), focos de la semana destacados, resumen de activos y
pendientes, fechas encima, aviso de proyectos sin tocar, lo siguiente que hacer.

**Ciclo** — abrir ciclo (fin calculado solo), objetivos con métrica, resultado esperado, riesgos
y prioridad, tope declarado de tres, cierre con destino explícito de cada objetivo (logrado /
pasa al siguiente / soltado) y aprendizajes. Historial de ciclos cerrados.

**Proyectos** — alta, edición, pausa, completado, archivado y borrado. Filtro por área. Vínculo
opcional a un objetivo del ciclo. Fecha objetivo con aviso configurable. Hitos con cálculo
automático del porcentaje, o deslizador manual. Pendientes con fecha, marcables desde el panel.
Gráfica de evolución del %.

**Áreas** — las ocho de partida sembrables de un golpe, editables. Puntuación actual y deseada del
1 al 10 con histórico. Rueda en canvas (relleno = dónde estás, punteado = dónde quieres estar).
Lista ordenada por distancia hasta la nota deseada, con indicador principal y acción semanal.

**Revisión** — semanal (qué funcionó, qué no, qué bloqueará, puntuación 1-10, elección de focos),
mensual (áreas y decisiones) y cierre de ciclo. Historial separado por tipo.

**Ajustes** — nombre, umbral de días sin tocar, antelación del aviso de fecha, copia de seguridad
y restauración.

**Datos de ejemplo** — un ciclo empezado hace tres semanas, dos objetivos, cuatro proyectos y las
ocho áreas puntuadas. Para probar el sistema entero sin escribir nada.

## Componentes propios, y por qué son distintos entre sí

Tres controles que se parecen y no deben confundirse:

* **`.escala`** — puntuación de áreas, 1 a 10. Rampa de un solo tono calculada por `rampa()`, de
  salvia claro `#E0E5D9` a verde medio `#334F46`, con anillo de 2 px en oro sobre el punto
  elegido (§4.3). Cinco columnas en móvil y diez desde 640 px, para no bajar de 48 px de ancho.
* **`.segmentado`** — dos o tres opciones excluyentes (hitos/manual, tipo de revisión). No es una
  escala, así que no lleva rampa: solo el anillo dorado.
* **`.chips`** — filtros por área. Tampoco son acciones, así que no pueden usar el primario: un
  filtro elegido no debe parecer el botón principal de la pantalla.
* **`.b-oscuro` y `.b-oscuro-2`** — la variante «sobre oscuro» del §4.1, para el CTA dentro de la
  tarjeta verde del temporizador. Un primario verde sobre fondo verde no se vería.
* **`.reloj`** — la cuenta atrás en Cormorant 300, no en monoespaciada. Es la cifra más grande de
  la app y §3.1 reserva la mono a tablas de datos.

## Pruebas

`prueba.js` levanta el archivo en jsdom y pasa 244 comprobaciones: arranque limpio, migración
v1→v4 sin pérdida, recorrido de las seis pantallas, los flujos de alta y edición, el tope de tres
focos, cierre de ciclo, persistencia, restauración desde copia, datos corruptos y escapado de HTML.

Tres bloques nuevos en v4 cubren lo que sostiene la tesis: el motor de tiempo (que separa bien los
cuatro destinos, que un día de hace un mes no entre en los últimos siete, que sin reparto declarado
no se fabrique uno), la lectura del Panel (que con media hora registrada no suelte ni un porcentaje,
y que con cinco horas fuera de objetivos sí lo diga sin culpabilizar) y la imputación manual.

Dos bloques son del día y del temporizador. El del temporizador usa un **reloj falso**: como el
motor se apoya en marcas de tiempo, basta con mover `Date.now()` para simular que han pasado
minutos o que iOS nos suspendió diez horas. Así se comprueban sin esperar las pausas, el
agotamiento de la fase estando fuera de la app, la pausa larga cada cuatro rondas y el tope del
tiempo registrado.

Los cuatro últimos bloques son de `DESIGN.md`: color y superficie, ausencia de ámbar, tipografía
y retícula (incluidas las tres escalas de §3.2 y los paddings de §5), escalas y área táctil, y
copy de botones contra §12. Comprueban cosas concretas: que la rampa de la escala sea monótona y
arranque y termine en los hex del documento, que el filete mida exactamente 64 px, que ningún
botón pase de tres palabras.

```
npm install jsdom
node prueba.js
```

Conviene ejecutarlo antes de dar por buena cualquier tanda de cambios. Lo que **no** cubre: nada
visual. La rueda, el contraste real y el aire de las pantallas hay que mirarlos en Safari.

## Ideas pendientes (sin decidir)

* Que el diario de la mañana recuerde la intención del día anterior
* Buscador sobre las entradas del diario
* Gráfica de la nota subjetiva frente a la objetiva a lo largo del ciclo
* Podar días antiguos: ahora el historial crece sin freno
* Vista de calendario o timeline del ciclo
* Que la revisión mensual proponga objetivos a partir del área con más distancia
* Recurrentes: hábitos semanales por área que se marquen y acumulen racha
* Horizonte de dos o tres años, muy poco detallado, que oriente los ciclos
* Multiusuario / perfiles con el patrón `?vista=` de DEKA, si alguna vez lo comparte
* Exportar el ciclo cerrado como documento para archivar fuera de la app

## Decisiones tomadas y por qué

* **Objetivo por encima de proyecto, no al revés.** Un proyecto sin objetivo sigue siendo válido
  (trabajo de fondo), pero se distingue. Forzar que todo cuelgue de un objetivo habría llevado a
  inventar objetivos falsos para justificar tareas.
* **`progresoObjetivo` devuelve `null` sin proyectos**, no 0. Un objetivo recién creado no está
  «al 0 %»: está sin traducir a trabajo, que es un problema distinto.
* **Avance y tiempo se dibujan por separado.** El único dato que de verdad hace falta a mitad de
  ciclo es si uno va por delante del otro.
* **El tope de tres objetivos se declara, no se impone.** La app avisa, no bloquea. §12 prohíbe el
  tono de productividad agresiva.
* **Archivar antes que borrar.** Los completados salen de la vista pero conservan su histórico; el
  borrado real avisa de que existe la alternativa.
* **Focos con caducidad de siete días.** Si no se replantean en la revisión, desaparecen solos en
  vez de quedarse fosilizados en el panel.
* **La rueda usa un solo tono.** §4.3 prohíbe rampas multicolor: la comparación la hace la forma
  del polígono, no el color.
* **Sin ámbar en toda la app.** Ver «Restricción principal». Es el cambio de aspecto más visible
  respecto a la primera versión del esqueleto, y viene de leer §2.4 y §11 juntas.
* **El botón de quitar es un icono lineal de 48 × 48**, no un carácter «×» de 24. §7 pide
  iconografía lineal y §8 fija el área táctil mínima.
* **La casilla se ve a 20 px y se toca a 48**, con un `::after` transparente. Agrandarla habría
  roto el ritmo de las listas.

### De v4 · el tiempo

* **La tesis manda.** Si una función no ayuda a responder «¿estoy dedicando mi tiempo a lo que digo
  que importa?», no entra. Eso descarta calendario, hábitos, notas, kanban, etiquetas, gamificación
  y un chatbot de productividad.
* **El reparto declarado es un campo nuevo, y hacía falta.** Las notas de área van del 1 al 10 y
  miden satisfacción: que quieras estar en un 8 de Salud no dice si merece el 10 % o el 30 % de tus
  horas. Normalizar las notas para fabricar porcentajes habría sido inventarse el dato.
* **Sin reparto declarado no hay comparación.** `repartoDeseado()` devuelve `null` y la app enseña
  solo la foto real. Es preferible a comparar contra algo que el usuario nunca dijo.
* **`d.minutosSueltos` estaba muerto en v3**: se escribía y no lo leía nadie. Todo el tiempo
  cronometrado sin tarea enfocada desaparecía. Ahora es `d.sueltos` y aparece como «sin asignar».
* **Avance y actividad son dos dimensiones distintas.** El porcentaje dice dónde está un proyecto;
  la actividad dice si se mueve. Un proyecto puede llevar dos meses al 68 %.
* **Los proyectos parados piden una decisión, no una notificación.** Aparcar, marcar que sigue viva
  o abrirla. Y el copy insiste en que soltar es legítimo.

### Del día y el temporizador

* **Hoy es la pestaña de entrada.** Al abrir la app lo primero no puede ser la estrategia.
* **El temporizador guarda una marca de fin, no un contador.** iOS suspende la PWA al bloquear la
  pantalla y cualquier `setInterval` se congela. Calculando contra `Date.now()` en cada pintada,
  el reloj es correcto al volver aunque hayan pasado veinte minutos.
* **No encadena fases solo.** Al terminar espera a que pulses la siguiente. Encadenar en segundo
  plano daría fases fantasma que nunca viste correr.
* **El tiempo trabajado se topa en el fin de la fase.** Si el móvil pasa la noche bloqueado, la
  sesión vale lo que duraba, no ocho horas. Y el tiempo en pausa no cuenta como trabajo — esto
  último fue un fallo real que las pruebas destaparon.
* **Parar a mitad también registra.** Media sesión es media sesión, no cero.
* **Las dos notas del día se enseñan juntas.** La distancia entre lo que sentiste y lo que hiciste
  dice más que cualquiera de las dos por separado, y en los dos sentidos: el día vivido peor de lo
  que fue, y el día bueno que no fue productivo.
* **El diario no puntúa el ánimo ni pide gratitud.** Es un examen, no un juicio: §12 prohíbe el
  tono de productividad agresiva.
* **Navegación superior con subrayado dorado**, no barra inferior con iconos: la barra inferior
  con emojis es el patrón de app de consumo y choca con el tono editorial (§4.4).
* **Sin sombras salvo en modal**: §6 construye jerarquía con superficie y espacio.
* **Dos modos de progreso en vez de uno**: hay proyectos que se dejan trocear en hitos y otros que
  no. Forzar hitos habría llevado a inventarlos.
* **El aviso de «sin tocar» no culpabiliza**: el copy sugiere pausar como opción legítima.

## El icono

Es el **isotipo CSB**, el archivo de marca sin redibujar. §10.1 asigna exactamente ese uso al
monograma solo: «favicon, avatar de redes, sello, marca de agua». Y §10.1 lo hace obligatorio por
debajo de 64 px, porque la silueta del loto se cierra y se ensucia a ese tamaño.

* `icon-180.png` — apple-touch-icon. **Tiene que ser PNG**: iOS no admite SVG aquí. Es el único
  archivo que acompaña al `index.html`.
* El favicon de 32 px va **incrustado en base64** dentro del HTML, para no sumar otro archivo.
* El fondo del icono es crema `#FAF5EF`, el mismo del `theme-color`, así que la barra de estado y
  el icono no se pelean.

Dos avisos para quien lo toque:

* **No redibujar el monograma.** §10.2 prohíbe cambiar la proporción y avisa de que si el lazo de
  la B se simplifica hasta parecer un ∞ suelto, la marca pierde su tercera inicial. En esta sesión
  se intentó reconstruirlo a partir de la descripción escrita y salió mal: monolineal en vez de
  serif, y con la B ilegible. Se descartó en cuanto aparecieron los archivos reales.
* **A 32 px el monograma casi desaparece**, porque el trazo serif es finísimo. Es una propiedad de
  la marca, no un defecto del archivo, y no se arregla engordando el trazo por nuestra cuenta.

## Cómo publicarlo

Mismo flujo que DEKA Trainer:

1. Repo nuevo en GitHub (o carpeta dentro de uno existente). **Público**: con el plan gratuito,
   Pages solo funciona en repos públicos.
2. Subir `index.html` **y `icon-180.png`** a la raíz de la rama `main`
3. Settings → Pages → Deploy from a branch → main → / (root)
4. Añadir un archivo vacío `.nojekyll` en la raíz
5. Abrir la URL en Safari → Compartir → Añadir a pantalla de inicio

Los datos viven en el dispositivo, bajo el dominio. Cambiar de dominio implica empezar de cero:
exportar antes desde Ajustes.

`prueba.js` no forma parte de la app y no hace falta subirlo.

Si Pages se queda en 404 con todo bien configurado, suele ser que activaste Pages *después* de
subir los archivos y se quedó esperando un cambio en la rama que nunca llegó. Se destraba con
cualquier commit nuevo — editar el README y guardar basta.
