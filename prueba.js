/* Prueba en DOM headless de index.html — no forma parte de la app. */
const fs=require("fs"), {JSDOM}=require("jsdom");

let fallos=0, pruebas=0;
function ok(cond,msg){ pruebas++; if(!cond){ fallos++; console.log("  FALLO · "+msg); } }
function bloque(t){ console.log("\n── "+t); }

/* canvas falso: registra las llamadas sin dibujar */
function stubCanvas(win){
  win.HTMLCanvasElement.prototype.getContext=function(){
    const noop=()=>{};
    return new Proxy({},{get:(t,k)=>{
      if(k==="measureText") return ()=>({width:10});
      if(k==="canvas") return null;
      return typeof k==="string"&&/^(fillStyle|strokeStyle|lineWidth|font|textAlign|textBaseline|lineJoin)$/.test(k)?"":noop;
    },set:()=>true});
  };
}

const {VirtualConsole}=require("jsdom");
function arrancar(datosPrevios){
  const html=fs.readFileSync(__dirname+"/index.html","utf8");
  const errores=[];
  const vc=new VirtualConsole();
  vc.on("jsdomError",e=>{ if(!/scrollTo|Not implemented/.test(e.message)) errores.push(e.message); });
  vc.on("error",m=>errores.push(String(m)));
  const dom=new JSDOM(html,{
    runScripts:"dangerously", pretendToBeVisual:true, url:"https://local.test/",
    virtualConsole:vc,
    beforeParse(win){
      stubCanvas(win);
      win.scrollTo=()=>{};
      if(datosPrevios) win.localStorage.setItem("csb-proyectos-v1",JSON.stringify(datosPrevios));
    }
  });
  /* el reloj del temporizador late solo; en las pruebas se avanza a mano */
  dom.window.clearInterval(dom.window.tic);
  return {dom,w:dom.window,d:dom.window.document,errores};
}
/* Reloj falso: el temporizador se apoya en marcas de tiempo, así que basta con
   mover Date.now() para simular que han pasado minutos o que iOS nos suspendió. */
function relojFalso(w){
  let t=Date.now();
  const real=w.Date.now;
  w.Date.now=()=>t;
  return {avanzar:min=>{ t+=min*60000; }, restaurar:()=>{ w.Date.now=real; }};
}

/* ══ 1. arranque limpio ══ */
bloque("Arranque limpio");
{
  const {w,d,errores}=arrancar(null);
  ok(errores.length===0,"sin errores al arrancar: "+errores.join(" | "));
  ok(d.querySelectorAll("nav.tabs button").length===6,"seis pestañas");
  w.ir("panel");
  ok(/Empezamos por el ciclo/.test(d.getElementById("app").textContent),"panel vacío con la invitación al ciclo");
  ok(w.S._v===4,"estado en v4");
}

/* ══ 2. migración desde v1 ══ */
bloque("Migración v1 → v4");
{
  const v1={
    proyectos:[
      {id:"a1",nombre:"Programa Vida Inteligente",area:"Vida Inteligente",estado:"activo",desc:"x",
       modo:"hitos",pct:0,hitos:[{id:"h1",texto:"Guion",hecho:true},{id:"h2",texto:"Grabar",hecho:false}],
       pendientes:[{id:"p1",texto:"Cerrar índice",hecho:false,para:null}],
       creado:"2026-07-01",tocado:"2026-07-20",historia:[{fecha:"2026-07-01",pct:0},{fecha:"2026-07-20",pct:50}]},
      {id:"a2",nombre:"App DEKA",area:"Tecnología",estado:"completado",desc:"",modo:"hitos",pct:0,
       hitos:[{id:"h3",texto:"Prototipo",hecho:true}],pendientes:[],
       creado:"2026-06-01",tocado:"2026-06-30",historia:[]}
    ],
    revisiones:[{fecha:"2026-08-01",notas:"Semana floja"}],
    ajustes:{nombre:"Miguel",diasSinTocar:10},
    _v:1
  };
  const {w,d,errores}=arrancar(v1);
  ok(errores.length===0,"sin errores al migrar: "+errores.join(" | "));
  ok(w.S._v===4,"versión actualizada");
  ok(w.S.proyectos.length===2,"no se pierde ningún proyecto");
  ok(w.S.areas.length===2,"se crean las dos áreas que había");
  ok(w.S.areas.some(a=>a.nombre==="Tecnología"&&a.tipo==="negocio"),"Tecnología se clasifica como negocio");
  const p1=w.S.proyectos.find(p=>p.id==="a1");
  ok(p1.areaId&&w.area(p1.areaId).nombre==="Vida Inteligente","el proyecto queda enlazado a su área");
  ok(p1.area===undefined,"el campo antiguo se elimina");
  ok(p1.historia.length===2,"se conserva el histórico");
  ok(w.progreso(p1)===50,"el porcentaje por hitos sigue saliendo igual");
  ok(w.S.proyectos.find(p=>p.id==="a2").archivado===true,"lo completado entra archivado");
  ok(w.S.revisiones.length===1&&w.S.revisiones[0].tipo==="semanal","las revisiones antiguas pasan a semanales");
  ok(w.S.revisiones[0].funciono==="Semana floja","las notas antiguas se conservan");
  ok(w.S.ajustes.avisoFecha===7,"el ajuste nuevo toma su valor por defecto");
  ok(Array.isArray(w.S.dias)&&w.S.dias.length===0,"v3 añade el registro de días vacío");
  ok(w.S.ajustes.pomodoro.trabajo===25,"y los ciclos por defecto del temporizador");
  ok(w.S.proyectos.every(p=>p.minutos===0),"los proyectos antiguos arrancan con cero minutos");
}

/* ══ 3. datos de ejemplo y recorrido de pantallas ══ */
bloque("Ejemplos y pantallas");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();
  ok(errores.length===0,"sin errores al cargar ejemplos: "+errores.join(" | "));
  ok(w.S.areas.length===8,"ocho áreas");
  ok(w.S.objetivos.length===2,"dos objetivos");
  ok(w.S.proyectos.length===4,"cuatro proyectos");
  ok(w.cicloActivo()!==null,"hay un ciclo activo");
  ok(w.semanaCiclo(w.cicloActivo())===4,"tres semanas corridas = semana 4");
  ok(w.pctTiempo(w.cicloActivo())>0&&w.pctTiempo(w.cicloActivo())<50,"tiempo transcurrido razonable");

  ["hoy","panel","ciclo","proyectos","areas","revision"].forEach(t=>{
    w.ir(t);
    const txt=d.getElementById("app").textContent.trim();
    ok(txt.length>50,"la pestaña "+t+" pinta contenido");
    ok(errores.length===0,"la pestaña "+t+" no lanza errores: "+errores.join(" | "));
  });

  w.ir("panel");
  const panel=d.getElementById("app").textContent;
  ok(/Ciclo en curso/.test(panel),"el panel muestra el ciclo");
  ok(/Tus focos/.test(panel),"el panel muestra los focos");
  ok(/Fechas encima/.test(panel),"el panel avisa de las fechas próximas");
  ok(d.querySelectorAll("#app .card.destacada").length===2,"dos tarjetas destacadas como foco");

  w.ir("areas");
  ok(/La rueda/.test(d.getElementById("app").textContent),"la rueda aparece con ocho áreas puntuadas");
  w.dibujarRueda();   /* en la app la dispara un setTimeout, aquí se llama a mano */
  ok(d.querySelector("#rueda canvas")!==null,"la rueda dibuja un lienzo");
}

/* ══ 4. flujos ══ */
bloque("Flujos");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();

  /* alta de proyecto */
  w.editarProyecto();
  d.getElementById("pNombre").value="Proyecto de prueba";
  d.getElementById("pDesc").value="descripción";
  d.getElementById("pPara").value="2026-09-30";
  w.guardarProyecto(null);
  const np=w.S.proyectos.find(p=>p.nombre==="Proyecto de prueba");
  ok(!!np,"se crea el proyecto");
  ok(np.para==="2026-09-30","guarda la fecha objetivo");
  ok(np.archivado===false,"nace sin archivar");

  /* hitos y progreso */
  w.verDetalle(np.id);
  d.getElementById("nuevoHito").value="Primer hito";
  w.addHito(np.id);
  w.verDetalle(np.id);
  d.getElementById("nuevoHito").value="Segundo hito";
  w.addHito(np.id);
  ok(w.proy(np.id).hitos.length===2,"dos hitos añadidos");
  w.proy(np.id).hitos[0].hecho=true;
  ok(w.progreso(w.proy(np.id))===50,"un hito de dos = 50 %");

  /* pendiente con fecha */
  w.verDetalle(np.id);
  d.getElementById("nuevaPend").value="Paso concreto";
  d.getElementById("nuevaPendFecha").value="2026-08-14";
  w.addPend(np.id);
  ok(w.proy(np.id).pendientes[0].para==="2026-08-14","la pendiente guarda su fecha");

  /* archivar */
  w.archivar(np.id);
  ok(w.proy(np.id).archivado===true,"se archiva");
  ok(w.vivos().every(p=>p.id!==np.id),"desaparece de los vivos");
  w.archivar(np.id);
  ok(w.proy(np.id).archivado===false,"se desarchiva");

  /* focos: tope de tres */
  w.planificarSemana();
  const checks=d.querySelectorAll("#listaFocos .check");
  ok(checks.length===w.activos().length,"la lista de focos incluye todos los activos");
  w._focos=[];
  checks[0].onclick(); checks[1].onclick(); checks[2].onclick(); checks[3].onclick();
  ok(w._focos.length===3,"no deja pasar de tres focos");
  w.guardarFocos();
  ok(w.S.focos.ids.length===3,"los focos se guardan");
  ok(w.focosVigentes().length===3,"los focos están vigentes hoy");

  /* objetivo */
  w.ir("ciclo");
  w.editarObjetivo();
  d.getElementById("oNombre").value="Objetivo de prueba";
  d.getElementById("oResultado").value="Un resultado";
  d.getElementById("oMetrica").value="Una métrica";
  w.guardarObjetivo(null);
  const no=w.S.objetivos.find(o=>o.nombre==="Objetivo de prueba");
  ok(!!no,"se crea el objetivo");
  ok(no.cicloId===w.cicloActivo().id,"queda dentro del ciclo activo");
  ok(w.progresoObjetivo(no)===null,"sin proyectos, el avance es indeterminado");
  w.proy(np.id).objetivoId=no.id;
  ok(w.progresoObjetivo(no)===w.progreso(w.proy(np.id)),"con un proyecto, hereda su avance");

  /* borrar objetivo desvincula, no borra proyectos */
  const antes=w.S.proyectos.length;
  w.borrarObjetivo(no.id);
  ok(w.S.proyectos.length===antes,"borrar el objetivo no borra proyectos");
  ok(w.proy(np.id).objetivoId===null,"el proyecto queda suelto");

  /* puntuación de áreas */
  w.ir("areas");
  w.puntuarAreas();
  const idA=w.S.areas[0].id;
  w._punt[idA].actual=9; w._punt[idA].deseada=10;
  w.guardarPuntuaciones();
  ok(w.area(idA).actual===9,"guarda la nota actual");
  ok(w.area(idA).revisado===w.hoy(),"marca la fecha de revisión");
  ok(w.area(idA).historia.slice(-1)[0].actual===9,"añade la nota al histórico");

  /* revisión semanal */
  w.ir("revision");
  d.getElementById("rFunciono").value="Avanzó la grabación";
  d.getElementById("rNo").value="La página de venta ni la toqué";
  d.getElementById("rPunt").value="7";
  const nRev=w.S.revisiones.length;
  w.guardarRevision();
  ok(w.S.revisiones.length===nRev+1,"guarda la revisión");
  const r=w.S.revisiones.slice(-1)[0];
  ok(r.tipo==="semanal"&&r.puntuacion===7,"tipo y puntuación correctos");
  ok(r.cicloId===w.cicloActivo().id,"la revisión queda atada al ciclo");

  /* revisión vacía se rechaza */
  w.ir("revision");
  d.getElementById("rFunciono").value="  ";
  const n2=w.S.revisiones.length;
  w.guardarRevision();
  ok(w.S.revisiones.length===n2,"no guarda una revisión vacía");

  /* cierre de ciclo */
  const c=w.cicloActivo(), obs=w.objetivosDe(c.id);
  w.cerrarCiclo();
  d.getElementById("fin_"+obs[0].id).value="logrado";
  d.getElementById("fin_"+obs[1].id).value="activo";
  d.getElementById("cApre").value="Cabía menos de lo que pensaba";
  w.confirmarCierre(c.id);
  ok(w.cicloActivo()===null,"el ciclo queda cerrado");
  ok(w.objetivo(obs[0].id).estado==="logrado","el objetivo marcado se da por logrado");
  ok(w.objetivo(obs[1].id).cicloId===null,"el que continúa se suelta del ciclo cerrado");
  ok(w.S.revisiones.slice(-1)[0].tipo==="cierre","se registra la revisión de cierre");
  ok(errores.length===0,"sin errores durante los flujos: "+errores.join(" | "));
}

/* ══ 4 bis. el día, el diario y el temporizador ══ */
bloque("El día y el diario");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();
  ok(w.pestana==="hoy","Hoy es la pestaña de entrada");
  ok(d.querySelectorAll("nav.tabs button").length===6,"seis pestañas");

  const dia=w.diaHoy(false);
  ok(!!dia&&dia.fecha===w.hoy(),"hay un día de hoy");
  ok(w.minPlan(dia)===130,"suma los minutos previstos (60+30+40)");
  ok(w.minReal(dia)===55,"suma los minutos reales");
  /* 60 de 130 minutos cerrados ≈ 4.6 → 5 */
  ok(w.puntObjetiva(dia)===5,"la puntuación objetiva pondera por minutos, no por número de tareas");

  /* marcar una tarea cierra también la pendiente del proyecto */
  const t2=dia.tareas[1], p2=w.proy(t2.proyectoId);
  const pend=p2.pendientes.find(x=>x.id===t2.pendienteId);
  ok(pend&&!pend.hecho,"la pendiente del proyecto empieza abierta");
  w.marcarTarea(t2.id);
  ok(p2.pendientes.find(x=>x.id===t2.pendienteId).hecho===true,"marcarla en el día la cierra en el proyecto");
  w.marcarTarea(t2.id);
  ok(p2.pendientes.find(x=>x.id===t2.pendienteId).hecho===false,"y reabrirla la reabre");

  /* alta de tarea suelta */
  w.ir("hoy");
  d.getElementById("nuevaTarea").value="Llamar al gestor";
  d.getElementById("nuevaTareaMin").value="15";
  w.addTarea();
  const nueva=w.diaHoy(false).tareas.slice(-1)[0];
  ok(nueva.texto==="Llamar al gestor"&&nueva.min===15,"añade una tarea suelta con su duración");
  ok(nueva.proyectoId===null,"la suelta no cuelga de ningún proyecto");

  /* sugerencias: no entran solas y no se repiten una vez añadidas */
  const antes=w.sugerencias().length;
  ok(antes>0,"hay sugerencias desde las acciones de área");
  const s=w.sugerencias()[0];
  w.diaHoy(true).tareas.push({id:w.uid(),texto:s.texto,min:0,hecho:false,real:0,
    proyectoId:s.proyectoId||null,pendienteId:s.pendienteId||null,areaId:s.areaId||null});
  ok(w.sugerencias().length===antes-1,"lo añadido deja de sugerirse");

  /* diario de la mañana */
  w.diaHoy(true).manana=null; w.ir("hoy");
  d.getElementById("m_dificultades").value="Una consulta larga";
  w.guardarManana();
  ok(w.diaHoy(false).manana.dificultades==="Una consulta larga","guarda la entrada de la mañana");
  ok(!!w.diaHoy(false).manana.hechoEn,"con su marca de tiempo");

  /* cierre del día con puntuación subjetiva */
  w.ir("hoy");
  d.getElementById("n_torcio").value="La consulta se alargó";
  w._puntDia=4;
  w.cerrarDia();
  const dc=w.diaHoy(false);
  ok(dc.cerrado===true&&dc.punt===4,"cierra el día con la puntuación subjetiva");
  ok(dc.noche.torcio==="La consulta se alargó","y con la entrada de la noche");
  w.ir("hoy");
  ok(/Día cerrado/.test(d.getElementById("app").textContent),"la pantalla refleja que está cerrado");
  ok(errores.length===0,"sin errores en el día: "+errores.join(" | "));

  /* resumen de la semana en la revisión */
  const r=w.resumenSemana();
  ok(r.dias===1&&r.subjetiva===4,"la revisión ve la puntuación del día");
  w.ir("revision");
  ok(/Tu semana/.test(d.getElementById("app").textContent),"y la muestra en la revisión semanal");
}

bloque("Temporizador");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();
  const reloj=relojFalso(w);
  const dia=w.diaHoy(false), tarea=dia.tareas[1], p=w.proy(tarea.proyectoId);
  const minutosAntes=p.minutos||0;

  w.enfocarTarea(tarea.id);
  ok(w.S.temporizador.tareaId===tarea.id,"enfoca la tarea");
  w.empezarTrabajo();
  ok(w.S.temporizador.fase==="trabajo","arranca en fase de trabajo");
  ok(w.restante()===25*60000,"con los 25 minutos del preajuste");
  ok(w.mmss(w.restante())==="25:00","y los pinta como 25:00");

  reloj.avanzar(10);
  ok(w.restante()===15*60000,"a los diez minutos quedan quince");

  /* pausar y reanudar conserva lo que quedaba */
  w.alternarPausa();
  ok(w.S.temporizador.enPausa===true,"se puede pausar");
  reloj.avanzar(30);
  ok(w.restante()===15*60000,"en pausa el reloj no corre, aunque pasen treinta minutos");
  w.alternarPausa();
  ok(w.restante()===15*60000,"al reanudar sigue donde estaba");

  /* la fase se agota mientras la app está suspendida */
  reloj.avanzar(20);
  ok(w.restante()===0,"pasado el tiempo no queda nada");
  w.alVolver();
  ok(w.S.temporizador.agotada===true,"al volver a la app la fase se cierra sola");
  const tareaDespues=w.diaHoy(false).tareas.find(x=>x.id===tarea.id);
  ok(tareaDespues.real===25,"registra 25 minutos: la media hora de pausa no cuenta como trabajo");
  ok(w.proy(tarea.proyectoId).minutos===minutosAntes+25,"y los sube al proyecto");

  /* la pausa no arranca sola */
  ok(w.S.temporizador.fase==="trabajo","no encadena solo: sigue esperando en la fase de trabajo");
  w.empezarPausa();
  ok(w.S.temporizador.fase==="pausa","la pausa arranca cuando la pides");
  ok(w.restante()===5*60000,"y dura cinco minutos");

  /* cuarta ronda: pausa larga */
  w.S.temporizador.ronda=4;
  w.empezarPausa();
  ok(w.S.temporizador.fase==="pausaLarga","en la cuarta ronda toca pausa larga");
  ok(w.restante()===15*60000,"de quince minutos");

  /* parar a mitad también cuenta */
  w.siguienteDespuesDePausa();
  ok(w.S.temporizador.fase==="trabajo"&&w.S.temporizador.ronda===5,"vuelve al trabajo y sube de ronda");
  const antesParar=w.diaHoy(false).tareas.find(x=>x.id===tarea.id).real;
  reloj.avanzar(7);
  w.pararTemporizador(true);
  ok(w.diaHoy(false).tareas.find(x=>x.id===tarea.id).real===antesParar+7,"parar a mitad registra los minutos hechos");
  ok(w.S.temporizador===null,"y deja el temporizador parado");

  /* configuración de ciclos */
  w.ajustarPomodoro();
  d.getElementById("pTrabajo").value="50";
  d.getElementById("pPausa").value="10";
  w.guardarPomodoro();
  ok(w.S.ajustes.pomodoro.trabajo===50&&w.S.ajustes.pomodoro.pausa===10,"guarda los ciclos a medida");
  w.empezarTrabajo();
  ok(w.restante()===50*60000,"y la siguiente sesión ya dura 50 minutos");

  /* no se cambia de tarea con una sesión corriendo, pero sí si no había ninguna */
  const otra=w.diaHoy(false).tareas[2];
  w.enfocarTarea(otra.id);
  ok(w.S.temporizador.tareaId===otra.id,"sin tarea enfocada, se puede asignar una a mitad de sesión");
  const tercera=w.diaHoy(false).tareas[0];
  w.enfocarTarea(tercera.id);
  ok(w.S.temporizador.tareaId===otra.id,"con una tarea ya enfocada, no deja cambiarla sin parar");

  /* una suspensión larga no infla la sesión */
  w.pararTemporizador(true);
  w.enfocarTarea(otra.id); w.empezarTrabajo();
  const antesNoche=w.diaHoy(false).tareas.find(x=>x.id===otra.id).real||0;
  reloj.avanzar(600);            // el móvil pasa diez horas bloqueado
  w.alVolver();
  ok(w.diaHoy(false).tareas.find(x=>x.id===otra.id).real===antesNoche+50,
     "tras diez horas suspendida, la sesión vale sus 50 minutos, no diez horas");

  /* el estado sobrevive a una recarga */
  const guardado=JSON.parse(w.localStorage.getItem("csb-proyectos-v1"));
  ok(guardado.temporizador&&guardado.temporizador.fin>0,"el temporizador se persiste con su marca de fin");
  reloj.restaurar();
  ok(errores.length===0,"sin errores en el temporizador: "+errores.join(" | "));
}

/* ══ 4 ter. el motor de tiempo ══ */
bloque("Motor de tiempo");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();
  const pObj=w.S.proyectos[0];          // cuelga de un objetivo
  const pFondo=w.S.proyectos[3];        // trabajo de fondo, sin objetivo
  const areaSalud=w.S.areas.find(a=>a.nombre==="Salud física");

  /* un día de hace tres, con tiempo repartido por los cuatro destinos */
  const ayer=w.sumarDias(w.hoy(),-3);
  w.S.dias.push({fecha:ayer,manana:null,noche:null,punt:null,cerrado:true,sueltos:20,tareas:[
    {id:"t1",texto:"Grabar",min:60,real:60,hecho:true,proyectoId:pObj.id,pendienteId:null,areaId:null},
    {id:"t2",texto:"Retocar la web",min:30,real:30,hecho:true,proyectoId:pFondo.id,pendienteId:null,areaId:null},
    {id:"t3",texto:"Correr",min:40,real:40,hecho:true,proyectoId:null,pendienteId:null,areaId:areaSalud.id},
    {id:"t4",texto:"Papeleo",min:10,real:10,hecho:true,proyectoId:null,pendienteId:null,areaId:null}
  ]});

  const ds=w.ultimos(7), r=w.repartoTiempo(ds);
  ok(r.objetivo===115,"separa el tiempo que empuja un objetivo: 60 del día nuevo + 55 que ya traía hoy");
  ok(r.fondo===30,"del trabajo de fondo");
  ok(r.area===40,"de las acciones de área");
  ok(r.suelta===10,"y de las tareas sueltas");
  ok(r.sinTarea===20,"rescata el tiempo cronometrado sin tarea, que en v3 se perdía");
  ok(r.total===160+55,"el total incluye también lo que ya traía el día de hoy");

  /* por área: la acción de área va a la suya, el proyecto a la de su proyecto */
  const pa=w.tiempoPorArea(ds);
  ok(pa[areaSalud.id]===40,"la acción semanal se imputa a su área");
  ok(pa[pObj.areaId]>=60,"el proyecto se imputa al área del proyecto");

  ok(w.tiempoProyecto(ds,pObj.id)===60+55,"suma el tiempo de un proyecto en el rango");
  ok(w.tiempoObjetivo(ds,pObj.objetivoId)>=115,"y el de todos los proyectos de un objetivo");

  /* fuera del rango no cuenta */
  w.S.dias.push({fecha:w.sumarDias(w.hoy(),-30),tareas:[
    {id:"t9",texto:"Viejo",min:600,real:600,hecho:true,proyectoId:pObj.id,pendienteId:null,areaId:null}],sueltos:0});
  ok(w.tiempoProyecto(w.ultimos(7),pObj.id)===115,"un día de hace un mes no entra en los últimos siete");
  ok(w.tiempoProyecto(w.ultimos(60),pObj.id)===715,"pero sí en un rango largo");

  /* dice y hace */
  const dh=w.diceYHace(ds);
  ok(dh.hayDeseado===true,"los ejemplos traen reparto declarado");
  const suma=dh.filas.reduce((a,f)=>a+f.hace,0);
  ok(Math.round(suma)===100,"lo que haces suma 100 %");
  const salud=dh.filas.find(f=>f.area.id===areaSalud.id);
  ok(salud&&Math.round(salud.dice)===15,"el reparto declarado se normaliza a 100");

  /* sin reparto declarado, no hay comparación inventada */
  w.S.areas.forEach(a=>a.reparto=null);
  ok(w.repartoDeseado()===null,"sin declarar nada, no se fabrica un reparto deseado");
  ok(w.diceYHace(ds).hayDeseado===false,"y la comparación se desactiva sola");
  ok(errores.length===0,"sin errores en el motor: "+errores.join(" | "));
}

bloque("La lectura del Panel");
{
  /* Regla dura: con poco dato, la app no diagnostica. */
  const a=arrancar(null); a.w.cargarEjemplos();
  a.w.S.dias=[]; a.w.diaHoy(true).tareas=[
    {id:"x",texto:"Algo",min:30,real:30,hecho:true,proyectoId:null,pendienteId:null,areaId:null}];
  const L1=a.w.lecturaSemana();
  ok(/poco tiempo registrado/.test(L1.txt),"con media hora registrada no opina");
  ok(!/%/.test(L1.txt),"y no suelta ningún porcentaje");

  /* con dato suficiente y casi nada hacia objetivos, avisa */
  const b=arrancar(null); b.w.cargarEjemplos();
  b.w.S.dias=[]; b.w.diaHoy(true).tareas=[
    {id:"y",texto:"Papeleo",min:300,real:300,hecho:true,proyectoId:null,pendienteId:null,areaId:null}];
  const L2=b.w.lecturaSemana();
  ok(L2.tono==="aviso"&&/0 %/.test(L2.txt),"cinco horas sin tocar objetivos sí se comenta");
  ok(/no siempre es un problema/i.test(L2.detalle),"y el detalle no culpabiliza");

  /* la revisión tampoco saca conclusiones sin dato */
  const c=arrancar(null); c.w.cargarEjemplos();
  c.w.S.dias=[];
  const obs=c.w.loQueLlamaLaAtencion(c.w.ultimos(7),c.w.repartoTiempo(c.w.ultimos(7)));
  ok(obs.length===1&&/no sacar conclusiones/.test(obs[0]),"la revisión se calla con poco dato");
  ok(c.w.loQueLlamaLaAtencion(b.w.ultimos(7),{total:600,objetivo:500}).length<=3,"nunca más de tres observaciones");
}

bloque("Imputación manual");
{
  const {w,d,errores}=arrancar(null);
  w.cargarEjemplos();
  const dia=w.diaHoy(false), t=dia.tareas[1], p=w.proy(t.proyectoId);
  const antesP=p.minutos||0;
  ok((t.real||0)===0,"la tarea empieza sin tiempo");

  w.imputarTiempo(t.id);
  d.getElementById("impMin").value="45";
  w.guardarImputacion(t.id);
  ok(w.diaHoy(false).tareas.find(x=>x.id===t.id).real===45,"imputa los minutos a mano, sin temporizador");
  ok(w.proy(t.proyectoId).minutos===antesP+45,"y suben al proyecto igual que los cronometrados");
  ok(w.tiempoProyecto(w.ultimos(7),t.id?t.proyectoId:null)>=45,"el motor de tiempo los ve");

  /* imputar cero no hace nada */
  w.imputarTiempo(t.id);
  d.getElementById("impMin").value="0";
  w.guardarImputacion(t.id);
  ok(w.diaHoy(false).tareas.find(x=>x.id===t.id).real===45,"cero minutos no cambia nada");
  w.cerrarModal();

  /* al cerrar el día se pregunta por lo hecho sin tiempo */
  const t3=w.diaHoy(false).tareas[2];
  t3.hecho=true; t3.real=0;
  w.ir("hoy");
  const inputs=d.querySelectorAll(".minSinTiempo");
  ok(inputs.length>=1,"el cierre pregunta por las tareas hechas sin tiempo");
  const objetivo=Array.from(inputs).find(i=>i.getAttribute("data-id")===t3.id);
  ok(!!objetivo,"y una de ellas es la que acabamos de marcar");
  objetivo.value="50";
  d.getElementById("n_torcio").value="nada";
  w.cerrarDia();
  ok(w.diaHoy(false).tareas.find(x=>x.id===t3.id).real===50,"al cerrar recoge esos minutos");
  ok(errores.length===0,"sin errores en la imputación: "+errores.join(" | "));
}

/* ══ 5. persistencia y copia de seguridad ══ */
bloque("Persistencia");
{
  const {w,d}=arrancar(null);
  w.cargarEjemplos();
  const copia=JSON.stringify(w.S);
  const guardado=JSON.parse(w.localStorage.getItem("csb-proyectos-v1"));
  ok(guardado.proyectos.length===4,"lo guardado coincide con lo que hay en memoria");

  /* restaurar desde el texto de ajustes */
  w.abrirAjustes();
  d.getElementById("sDatos").value=copia;
  w.restaurar();
  ok(w.S.proyectos.length===4,"restaura sin perder nada");

  w.abrirAjustes();
  d.getElementById("sDatos").value="esto no es json";
  w.restaurar();
  ok(w.S.proyectos.length===4,"un texto inválido no destruye el estado");

  /* ajustes */
  w.abrirAjustes();
  d.getElementById("sNombre").value="Miguel";
  d.getElementById("sDias").value="14";
  d.getElementById("sFecha").value="3";
  w.guardarAjustes();
  ok(w.S.ajustes.diasSinTocar===14&&w.S.ajustes.avisoFecha===3,"los ajustes nuevos se guardan");

  /* borrar proyecto limpia los focos */
  const id=w.S.focos.ids[0];
  w.confirmarBorrado(id);
  ok(w.S.focos.ids.indexOf(id)<0,"al borrar un proyecto sale de los focos");
}

/* ══ 5 bis. copia en archivo y deshacer ══ */
bloque("Copia en archivo");
{
  const {w}=arrancar(null);
  /* jsdom no implementa createObjectURL ni la descarga: se apaña con dobles */
  let generado=null;
  w.URL.createObjectURL=()=>{ generado="blob:falso"; return generado; };
  w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){ this.dataset.pulsado="1"; };

  w.cargarEjemplos();
  const antes=w.S.proyectos.length;
  ok(w.diasDesdeCopia()===null,"sin copias no se inventa una fecha");
  ok(w.hayCopiaPrevia()===false,"al arrancar no hay nada que deshacer");

  w.descargarDatos();
  ok(generado!==null,"descargar copia genera el archivo");
  ok(w.diasDesdeCopia()===0,"descargar deja constancia de la fecha");

  w.aplicarDatos({proyectos:[],dias:[],ciclos:[],areas:[]});
  ok(w.S.proyectos.length===0,"aplicar una copia sustituye lo que había");
  ok(w.hayCopiaPrevia()===true,"restaurar guarda una foto del estado anterior");

  w.deshacerRestauracion();
  ok(w.S.proyectos.length===antes,"deshacer devuelve los proyectos de antes");
  ok(w.hayCopiaPrevia()===false,"deshacer consume la foto y no se repite");

  w.aplicarDatos("esto no es un objeto");
  ok(w.S.proyectos.length===antes,"una copia que no es un objeto no toca nada");
  w.aplicarDatos(null);
  ok(w.S.proyectos.length===antes,"un archivo vacío tampoco");
}

/* ══ 6. casos límite ══ */
bloque("Casos límite");
{
  const {w,d,errores}=arrancar({proyectos:null,areas:"roto",_v:2});
  ok(errores.length===0,"sobrevive a datos corruptos: "+errores.join(" | "));
  ok(Array.isArray(w.S.proyectos)&&Array.isArray(w.S.areas),"normaliza las listas rotas");

  const b=arrancar(null);
  b.w.cargarEjemplos();
  /* proyecto sin objetivo ni fecha ni historia */
  b.w.S.proyectos.forEach(p=>{ p.historia=[]; p.para=null; });
  b.w.ir("panel"); b.w.ir("ciclo"); b.w.ir("proyectos"); b.w.ir("areas"); b.w.ir("revision");
  ok(b.errores.length===0,"pinta con proyectos sin histórico ni fecha: "+b.errores.join(" | "));

  /* sin áreas: el alta de proyecto redirige en vez de romper */
  const c=arrancar(null);
  c.w.editarProyecto();
  ok(c.d.getElementById("velo").innerHTML==="","sin áreas no abre el formulario de proyecto");
  ok(c.errores.length===0,"y no lanza error");

  /* escapado */
  const e=arrancar(null);
  e.w.sembrarAreas();
  e.w.editarProyecto();
  e.d.getElementById("pNombre").value='<img src=x onerror="alert(1)">';
  e.w.guardarProyecto(null);
  e.w.ir("proyectos");
  ok(e.d.querySelectorAll("#app img").length===0,"el nombre con HTML se escapa");
  ok(/<img/.test(e.d.getElementById("app").textContent),"y se muestra como texto");
}

/* ══ 7. reglas de DESIGN.md que se pueden comprobar ══ */
bloque("DESIGN.md · color y superficie (§2, §6, §7)");
const html=fs.readFileSync(__dirname+"/index.html","utf8");
{
  const emoji=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  ok(!emoji.test(html),"§7 · sin emojis en ningún sitio");
  ok(!/background:\s*#fff\b/i.test(html),"§2.6.5 · sin blanco puro como fondo de página");
  ok(!/#000000|:\s*black\b/i.test(html),"§2.6.6 · sin negro puro");
  ok(!/linear-gradient\((?!45deg|135deg)/.test(html),"§2.6.8 · sin degradados (el del select es la flecha, no un fondo)");
  const reales=(html.match(/box-shadow:[^;]+/g)||[]).filter(s=>!/none|inset/.test(s));
  ok(reales.length===1&&/12px 40px/.test(reales[0]||""),"§6 · una sola sombra, la del modal ("+reales.length+")");
  ok(/rgba\(29,52,46,\.45\)/.test(html),"§6 · velo del modal al 45 %");
  const superficies=(html.match(/\.(card|modal|cita|velo)[^{]*\{[^}]*\}/g)||[]).join(" ");
  const radios=(superficies.match(/border-radius:[^;]+/g)||[]).join(" ").match(/\d+px/g)||[];
  ok(radios.map(r=>+r.replace("px","")).every(r=>r<=16),"§7 · ningún radio de superficie sobre 16 px ("+radios.join(", ")+")");
  ok(/border-radius:999px/.test(html),"§4.1 · botones en píldora");
  ok(/--oro-tostado:#7D6428/.test(html)&&/\.eyebrow\{[^}]*color:var\(--oro-tostado\)/.test(html),
     "§2.6.2 · el texto pequeño dorado usa oro tostado");
  ok(/\.card\.oscura \.eyebrow\{color:var\(--oro-claro\)\}/.test(html),"§2.6.3 · sobre oscuro el oro es el claro");
  ok(!/[^-]color:\s*var\(--taupe\)|[^-]color:\s*#9E8D77/.test(html),"§2.6.4 · el taupe no se usa como texto");
  ok(/stroke-width:1\.5/.test(html)&&!/fill:(?!none)/.test(html),"§7 · iconografía lineal de trazo 1.5, sin rellenos");
}

bloque("DESIGN.md · el ámbar (§2.4, §11)");
{
  ok(!/#F9BC60|--accion\b|b-accion/.test(html),"el ámbar no aparece: no hay acción de conversión en la app");
  const {w,d}=arrancar(null);
  w.cargarEjemplos();
  /* §2.6.1 limitaba a uno el botón ÁMBAR por vista. Sin ámbar, la regla útil es
     que ningún bloque tenga dos acciones principales compitiendo. */
  ["hoy","panel","ciclo","proyectos","areas","revision"].forEach(t=>{
    w.ir(t);
    d.querySelectorAll("#app .card").forEach((c,i)=>{
      const n=c.querySelectorAll(".b-primario").length;
      ok(n<=1,"§4.1 · "+t+", tarjeta "+(i+1)+": una sola acción principal (tiene "+n+")");
    });
    const sueltos=Array.from(d.querySelectorAll("#app > .seccion > .b-primario")).length;
    ok(sueltos<=1,"§4.1 · "+t+" tiene como mucho una acción principal fuera de las tarjetas");
  });
  /* §4.1 · dentro de una sección verde, el CTA es la variante sobre oscuro */
  w.ir("hoy");
  ok(d.querySelectorAll("#app .card.oscura .b-primario").length===0,"§4.1 · nada de primario sobre fondo verde");
  ok(d.querySelectorAll("#app .card.oscura .b-oscuro").length>=1,"§4.1 · el CTA sobre verde usa la variante clara");
}

bloque("DESIGN.md · tipografía y retícula (§3, §5, §8)");
{
  ok(/font-size:64px/.test(html)&&/font-size:48px/.test(html)&&/font-size:34px/.test(html),
     "§3.2 · la escala de desktop está presente (display 64, h1 48, h2 34)");
  ok(/@media\(min-width:640px\)/.test(html)&&/@media\(min-width:1024px\)/.test(html),
     "§8 · saltos de tablet y desktop");
  ok(/\.wrap\{[^}]*padding:0 24px/.test(html)&&/padding:0 48px/.test(html)&&/padding:0 80px/.test(html),
     "§5 · padding lateral 24 / 48 / 80");
  ok(/\.seccion\{padding:64px 0\}/.test(html)&&/\.seccion\{padding:96px 0\}/.test(html),
     "§5 · secciones a 64 en móvil y 96 en desktop");
  ok(/max-width:1200px/.test(html)&&/\.texto-max\{max-width:680px\}/.test(html),
     "§5 · contenedor 1200 y texto corrido 680");
  ok(/\.grid\{display:grid;gap:24px\}/.test(html),"§5 · canalón de 24 px");
  ok(/\.card\{[^}]*padding:28px 32px/.test(html),"§4.2 · padding de tarjeta 28 × 32");
  ok(/letter-spacing:\.22em/.test(html),"§3.2 · eyebrow con tracking 0.22em");
  ok(/font-variant-numeric:tabular-nums/.test(html),"§3.3 · cifras tabulares");
  ok(/Cormorant\+Garamond/.test(html)&&/family=Inter/.test(html),"§3.1 · las dos familias, ni una más");
  ok(!/font-weight:[789]00/.test(html),"§3.1 · sin pesos de 700 o más");
  /* filete: 28 + 2 + 4 + 2 + 28 = 64 px · §4.5 */
  const f=html.match(/\.filete\{[^}]*gap:(\d+)px[^}]*\}/), fi=html.match(/\.filete i\{[^}]*width:(\d+)px/);
  ok(f&&fi&&(+fi[1]*2+ +f[1]*2+4)===64,"§4.5 · el filete mide 64 px");
}

bloque("DESIGN.md · escalas y área táctil (§4.3, §8)");
{
  ok(/\.escala button\.sel\{outline:2px solid var\(--oro\)/.test(html),"§4.3 · el punto elegido lleva anillo dorado");
  ok(!/likert/.test(html),"el control segmentado ya no se llama ni se comporta como una escala Likert");
  const {w,d}=arrancar(null);
  w.sembrarAreas(); w.puntuarAreas();
  const btns=d.querySelectorAll('#listaPunt .fila-area .escala[data-k="actual"]')[0].querySelectorAll("button");
  ok(btns.length===10,"la escala tiene diez puntos");
  const fondos=Array.from(btns).map(b=>b.style.background);
  ok(new Set(fondos).size===10,"cada punto tiene su propio tono: es una rampa, no dos estados");
  const rgb=s=>s.match(/\d+/g).map(Number);
  const primero=rgb(fondos[0]), ultimo=rgb(fondos[9]);
  ok(primero[0]===224&&primero[1]===229&&primero[2]===217,"la rampa arranca en salvia claro #E0E5D9");
  ok(ultimo[0]===51&&ultimo[1]===79&&ultimo[2]===70,"y termina en verde medio #334F46");
  ok(fondos.every((s,i)=>i===0||rgb(s)[0]<rgb(fondos[i-1])[0]),"la rampa es monótona: un solo tono, nunca rojo→verde");
  /* área táctil */
  ok(/\.b-mini\{min-height:48px/.test(html),"§8 · los botones mini mantienen 48 px de alto");
  ok(/\.b-quitar\{min-height:48px;width:48px/.test(html),"§8 · el botón de quitar es de 48 × 48");
  ok(/\.check::after\{content:'';position:absolute;top:-14px/.test(html),"§8 · la casilla se toca a 48 aunque se vea a 20");
  ok(/button\.b\{[^}]*min-height:52px/.test(html),"§4.1 · 52 px de alto en móvil");
}

bloque("DESIGN.md · copy (§12)");
{
  const {w,d}=arrancar(null);
  w.cargarEjemplos();
  const textos=new Set();
  ["hoy","panel","ciclo","proyectos","areas","revision"].forEach(t=>{
    w.ir(t); d.querySelectorAll("#app button.b").forEach(b=>{ const s=b.textContent.trim(); if(s) textos.add(s); });
  });
  ["editarProyecto","editarObjetivo","abrirAjustes","planificarSemana","puntuarAreas"].forEach(fn=>{
    w[fn](); d.querySelectorAll("#velo button.b").forEach(b=>{ const s=b.textContent.trim(); if(s) textos.add(s); });
    w.cerrarModal();
  });
  const lista=Array.from(textos);
  const largos=lista.filter(s=>!/\(/.test(s)&&s.split(/\s+/).length>3);
  ok(largos.length===0,"§12 · ningún botón pasa de tres palabras: "+largos.join(" / "));
  ok(lista.every(s=>!/[.!¡]$/.test(s)),"§12 · sin punto ni exclamación final");
  const visible=Array.from(d.querySelectorAll("#app, #velo")).map(n=>n.textContent).join(" ");
  ok(!/[¡!]/.test(visible),"§12 · sin exclamaciones en el copy de sistema");
  ok(/«/.test(html)&&/»/.test(html),"§3.3 · comillas latinas");
}

console.log("\n"+(fallos?"✗ "+fallos+" fallos":"Todo correcto")+" · "+pruebas+" comprobaciones");
process.exit(fallos?1:0);
