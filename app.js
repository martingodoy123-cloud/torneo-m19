// 1. BASE DE DATA DE LOS EQUIPOS (Ranking M19)
const EQUIPOS = {
    1: "MARISTA R.C. - A", 2: "LOS TORDOS R.C. - A", 3: "LICEO R.C. - A",
    4: "UNIVERSITARIO S J A", 5: "MENDOZA R.C.", 6: "C.P.B.M",
    7: "PEUMAYEN R.C.", 8: "SAN JUAN R C A", 9: "TEQUE R.C.",
    10: "BANCO R.C.", 11: "MARISTA R.C. - B", 12: "SAN JUAN R C B",
    13: "SAN JORGE R C", 14: "TACURU R H", 15: "LOS TORDOS R C B",
    16: "JOCKEY CLUB S J", 17: "LICEO R.C. B", 18: "HUAZIHUL R C",
    19: "UNIVERSITARIO MZA", 20: "SC ALFILES"
};

// 2. CONTROL DEL TORNEO (Estructura única que maneja las dos fases con memoria permanente)
let torneo = JSON.parse(localStorage.getItem('torneo_m19_perfecto')) || {
    // Fase 1: Cruces Iniciales Oficiales
    L1: { local: 1, visita: 3, resL: null, resV: null },   
    L2: { local: 4, visita: 2, resL: null, resV: null },   
    L3: { local: 16, visita: 14, resL: null, resV: null }, 
    L4: { local: 13, visita: 15, resL: null, resV: null }, 
    L5: { local: 5, visita: 7, resL: null, resV: null },   
    L6: { local: 8, visita: 6, resL: null, resV: null },   
    L7: { local: 12, visita: 10, resL: null, resV: null }, 
    L8: { local: 9, visita: 11, resL: null, resV: null },  
    REP1: { local: 17, visita: 20, resL: null, resV: null }, 
    REP2: { local: 18, visita: 19, resL: null, resV: null },
    
    // Fase 2: Resultados cargados en Reclasificación
    G1: { resL: null, resV: null },
    G2: { resL: null, resV: null },
    G3: { resL: null, resV: null },
    G4: { resL: null, resV: null },
    G5: { resL: null, resV: null },
    G6: { resL: null, resV: null }
};

document.addEventListener("DOMContentLoaded", () => {
    dibujarTodoElTablero();
});

// Procesa el cambio numérico de cualquier casillero de la Fase 1 o Fase 2
function registrarPuntaje(fase, partidoId, lado, valor) {
    if (fase === 'fase1') {
        torneo[partidoId][lado] = valor === "" ? null : parseInt(valor);
    } else {
        torneo[partidoId][lado] = valor === "" ? null : parseInt(valor);
    }
    
    localStorage.setItem('torneo_m19_perfecto', JSON.stringify(torneo));
    dibujarTodoElTablero(); // Redibuja dinámicamente manteniendo el foco lógico
}

function dibujarTodoElTablero() {
    // ---- RENDER DE FASE 1 ----
    document.getElementById('partidos-repechaje').innerHTML = `
        ${inyectarFilaFase1('REP1', torneo.REP1)}
        ${inyectarFilaFase1('REP2', torneo.REP2)}
    `;

    let htmlLlaves = "";
    for (let i = 1; i <= 8; i++) {
        htmlLlaves += inyectarFilaFase1(`L${i}`, torneo[`L${i}`]);
    }
    document.getElementById('partidos-llave').innerHTML = htmlLlaves;

    // ---- CÁLCULOS DINÁMICOS DE NOMBRES PARA FASE 2 ----
    const deponerPerdedor = (p) => {
        if (p.resL === null || p.resV === null) return "Por definir";
        return p.resL > p.resV ? EQUIPOS[p.visita] : EQUIPOS[p.local];
    };

    const deponerRepechaje = (p, buscarGanador) => {
        if (p.resL === null || p.resV === null) return "Por definir";
        const ganoLocal = p.resL > p.resV;
        if (buscarGanador) return ganoLocal ? EQUIPOS[p.local] : EQUIPOS[p.visita];
        return ganoLocal ? EQUIPOS[p.visita] : EQUIPOS[p.local];
    };

    // Cruces oficiales según la normativa de la competencia
    const nombresFase2 = {
        G1: { local: deponerPerdedor(torneo.L1), visita: deponerRepechaje(torneo.REP1, false) },
        G2: { local: deponerPerdedor(torneo.L2), visita: deponerRepechaje(torneo.REP2, false) }, 
        G3: { local: deponerPerdedor(torneo.L3), visita: deponerRepechaje(torneo.REP1, true) },
        G4: { local: deponerPerdedor(torneo.L4), visita: deponerRepechaje(torneo.REP2, true) },  
        G5: { local: deponerPerdedor(torneo.L5), visita: deponerPerdedor(torneo.L8) },
        G6: { local: deponerPerdedor(torneo.L6), visita: deponerPerdedor(torneo.L7) }
    };

    // ---- RENDER DE FASE 2 (Con inputs funcionales fijados) ----
    let htmlFase2 = "";
    Object.keys(nombresFase2).forEach(id => {
        const nombres = nombresFase2[id];
        const resL = torneo[id].resL !== null ? torneo[id].resL : "";
        const resV = torneo[id].resV !== null ? torneo[id].resV : "";

        htmlFase2 += `
            <div class="partido-row">
                <span class="id-partido">${id}</span>
                <div class="equipo local">${nombres.local}</div>
                <input type="number" value="${resL}" placeholder="-" onchange="registrarPuntaje('fase2', '${id}', 'resL', this.value)">
                <input type="number" value="${resV}" placeholder="-" onchange="registrarPuntaje('fase2', '${id}', 'resV', this.value)">
                <div class="equipo visita">${nombres.visita}</div>
            </div>
        `;
    });
    document.getElementById('partidos-reclasificacion').innerHTML = htmlFase2;

    // ---- CÁLCULO FINAL DE COPAS (PLATA Y BRONCE) ----
    let platas = [];
    let bronces = [];

    Object.keys(nombresFase2).forEach(id => {
        const partidoAct = torneo[id];
        const nom = nombresFase2[id];
        
        if (nom.local !== "Por definir" && nom.visita !== "Por definir" && partidoAct.resL !== null && partidoAct.resV !== null) {
            if (partidoAct.resL > partidoAct.resV) {
                platas.push(nom.local);
                bronces.push(nom.visita);
            } else {
                platas.push(nom.visita);
                bronces.push(nom.local);
            }
        }
    });

    document.getElementById('lista-plata').innerHTML = platas.map(n => `<li>🏆 ${n}</li>`).join('') || '<li>Esperando resultados de Fase 2...</li>';
    document.getElementById('lista-bronce').innerHTML = bronces.map(n => `<li>🛡️ ${n}</li>`).join('') || '<li>Esperando resultados de Fase 2...</li>';
}

function inyectarFilaFase1(id, partido) {
    const resL = partido.resL !== null ? partido.resL : "";
    const resV = partido.resV !== null ? partido.resV : "";
    const marcaHuazihul = partido.local === 18 || partido.visita === 18 ? 'partido-huazihul' : '';

    return `
        <div class="partido-row ${marcaHuazihul}">
            <span class="id-partido">${id}</span>
            <div class="equipo local">${EQUIPOS[partido.local]}</div>
            <input type="number" value="${resL}" placeholder="-" onchange="registrarPuntaje('fase1', '${id}', 'resL', this.value)">
            <input type="number" value="${resV}" placeholder="-" onchange="registrarPuntaje('fase1', '${id}', 'resV', this.value)">
            <div class="equipo visita">${EQUIPOS[partido.visita]}</div>
        </div>
    `;
}