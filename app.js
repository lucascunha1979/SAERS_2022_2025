
"use strict";

const CONFIG = {

    anos: [2022, 2023, 2024, 2025],

    disciplinas: {
        LP: "Língua Portuguesa",
        MT: "Matemática"
    },

    etapas: {
        "2EF": "2º ano do Ensino Fundamental",
        "5EF": "5º ano do Ensino Fundamental",
        "9EF": "9º ano do Ensino Fundamental",
        "3EM": "3ª série do Ensino Médio"
    },

    redes: {
        T: "Todas as redes",
        E: "Rede Estadual",
        M: "Rede Municipal"
    },

    locais: {
        T: "Todas as localizações",
        U: "Urbana",
        R: "Rural"
    },

    padroes: {
        ABAIXO_BASICO: "Abaixo do Básico",
        BASICO: "Básico",
        ADEQUADO: "Adequado",
        AVANCADO: "Avançado"
    }
};


const CORES = {
    abaixo: "#42a5f5",
    basico: "#173f9d",
    adequado: "#f57920",
    avancado: "#6e197d",
    proficiencia: "#1769aa",
    participacao: "#14844f",
    meta: "#b33a3a"
};


const ESTADO = {
    aba: "estado",
    ano: 2025,
    disciplina: "LP",
    etapa: "2EF",
    rede: "E",
    local: "T",
    indicador: "pmx",
    animando: false,
    timer: null
};


const CACHE = {
    manifest: null,
    schemas: null,
    metadados: null,
    mapas: {},
    analitico: new Map(),
    escolaFiltros: new Map()
};


let mapaEstado = null;
let camadaMunicipiosEstado = null;


async function fetchJSON(caminho) {

    const resposta = await fetch(
        caminho,
        {
            cache: "no-store"
        }
    );

    if (!resposta.ok) {
        throw new Error(
            `${caminho} — HTTP ${resposta.status}`
        );
    }

    return await resposta.json();
}


function fmtInt(valor) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        Number.isNaN(Number(valor))
    ) {
        return "—";
    }

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    );
}


function fmtPct(valor) {

    if (
        valor === null
        ||
        valor === undefined
        ||
        Number.isNaN(Number(valor))
    ) {
        return "—";
    }

    return (
        Number(valor).toLocaleString(
            "pt-BR",
            {
                maximumFractionDigits: 0
            }
        )
        +
        "%"
    );
}


function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function reconstruirRegistro(
    nivel,
    ano,
    schema,
    valores
) {

    const registro = {};

    schema.forEach(
        (campo, indice) => {
            registro[campo] = valores[indice];
        }
    );

    registro.a = ano;

    if (nivel === "RS") {
        registro.cr = null;
        registro.m = null;
        registro.e = null;
    }

    else if (nivel === "CRE") {
        registro.cr = registro.id;
        registro.m = null;
        registro.e = null;
    }

    else if (nivel === "MUNICIPIO") {
        registro.m = registro.id;
        registro.e = null;
    }

    else if (nivel === "ESCOLA") {
        registro.e = registro.id;
    }

    return registro;
}


function reconstruirPayload(payload) {

    const schema = CACHE.schemas.schemas[payload.v];

    if (!schema) {
        throw new Error(
            `Schema inexistente para ${payload.v}`
        );
    }

    return payload.d.map(
        linha =>
            reconstruirRegistro(
                payload.v,
                payload.a,
                schema,
                linha
            )
    );
}


function localizarArquivo(
    nivel,
    ano
) {

    return CACHE.manifest.arquivos.find(
        item =>
            item.nivel === nivel
            &&
            Number(item.ano) === Number(ano)
    );
}


async function carregarNivelAno(
    nivel,
    ano
) {

    const chave = `${nivel}|${ano}`;

    if (CACHE.analitico.has(chave)) {
        return CACHE.analitico.get(chave);
    }

    const item = localizarArquivo(
        nivel,
        ano
    );

    if (!item) {
        throw new Error(
            `Arquivo não localizado: ${nivel} ${ano}`
        );
    }

    const payload = await fetchJSON(
        item.arquivo
    );

    const registros = reconstruirPayload(
        payload
    );

    CACHE.analitico.set(
        chave,
        registros
    );

    return registros;
}


async function carregarEscolaFiltros(ano) {

    if (CACHE.escolaFiltros.has(ano)) {
        return CACHE.escolaFiltros.get(ano);
    }

    const obj = await fetchJSON(
        `dados/escola_filtros/${ano}.json`
    );

    CACHE.escolaFiltros.set(
        ano,
        obj.dados
    );

    return obj.dados;
}


function registroCompativel(r) {

    return (
        r.d === ESTADO.disciplina
        &&
        r.et === ESTADO.etapa
        &&
        r.r === ESTADO.rede
        &&
        r.l === ESTADO.local
    );
}


async function obterRegistroRS(ano) {

    const dados = await carregarNivelAno(
        "RS",
        ano
    );

    return (
        dados.find(registroCompativel)
        ??
        null
    );
}


function atualizarDescricaoSelecao() {

    const disciplina = CONFIG.disciplinas[
        ESTADO.disciplina
    ];

    const etapa = CONFIG.etapas[
        ESTADO.etapa
    ];

    const rede = CONFIG.redes[
        ESTADO.rede
    ];

    const local = CONFIG.locais[
        ESTADO.local
    ];

    document.getElementById(
        "descricao-selecao"
    ).textContent =
        `${ESTADO.ano} · ${disciplina} · ${etapa} · ${rede} · ${local}`;
}


function mostrarSemResultado() {

    const ids = [
        "card-prof",
        "card-part",
        "card-prev",
        "card-efet",
        "card-padrao",
        "card-meta",
        "pct-abaixo",
        "pct-basico",
        "pct-adequado",
        "pct-avancado"
    ];

    for (const id of ids) {
        document.getElementById(
            id
        ).textContent = "—";
    }

    document.getElementById(
        "card-prof-padrao"
    ).textContent =
        "Sem resultado para a combinação";

    document.getElementById(
        "card-meta-status"
    ).textContent =
        "Sem meta aplicável";

    document.getElementById(
        "badge-status-dados"
    ).textContent =
        "Sem resultado";
}


function atualizarCards(r) {

    if (!r) {
        mostrarSemResultado();
        return;
    }

    document.getElementById(
        "card-prof"
    ).textContent = fmtInt(r.pmx);

    document.getElementById(
        "card-part"
    ).textContent = fmtPct(r.ppx);

    document.getElementById(
        "card-prev"
    ).textContent = fmtInt(r.np);

    document.getElementById(
        "card-efet"
    ).textContent = fmtInt(r.ne);

    const nomePadrao =
        CONFIG.padroes[r.pmi]
        ??
        r.pmi
        ??
        "—";

    document.getElementById(
        "card-padrao"
    ).textContent = nomePadrao;

    document.getElementById(
        "card-prof-padrao"
    ).textContent = nomePadrao;

    document.getElementById(
        "pct-abaixo"
    ).textContent = fmtPct(r.pabx);

    document.getElementById(
        "pct-basico"
    ).textContent = fmtPct(r.pbx);

    document.getElementById(
        "pct-adequado"
    ).textContent = fmtPct(r.padx);

    document.getElementById(
        "pct-avancado"
    ).textContent = fmtPct(r.pavx);

    const cardMeta = document.getElementById(
        "card-meta-container"
    );

    if (
        r.m27 !== null
        &&
        r.m27 !== undefined
    ) {

        document.getElementById(
            "card-meta"
        ).textContent = fmtInt(r.m27);

        document.getElementById(
            "card-meta-status"
        ).textContent =
            r.smk ?? "—";

        cardMeta.classList.remove(
            "sem-meta"
        );
    }

    else {

        document.getElementById(
            "card-meta"
        ).textContent = "—";

        document.getElementById(
            "card-meta-status"
        ).textContent =
            "Meta estadual não aplicável ao filtro";

        cardMeta.classList.add(
            "sem-meta"
        );
    }

    document.getElementById(
        "badge-status-dados"
    ).textContent =
        "Resultado disponível";
}


function inicializarMapaEstado() {

    mapaEstado = L.map(
        "mapa-estado",
        {
            zoomControl: true,
            preferCanvas: true,
            attributionControl: true
        }
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; colaboradores do OpenStreetMap',
            maxZoom: 12,
            subdomains: "abc"
        }
    ).addTo(
        mapaEstado
    );

    camadaMunicipiosEstado = L.geoJSON(
        CACHE.mapas.municipios,
        {
            style:
                () => ({
                    color: "#778995",
                    weight: 0.75,
                    opacity: 0.9,
                    fillColor: "#dce7ed",
                    fillOpacity: 0.36
                }),

            onEachFeature:
                (feature, layer) => {

                    const nome =
                        feature.properties?.NM_MUNICIPIO
                        ??
                        feature.properties?.nm_municipio
                        ??
                        "Município";

                    layer.bindTooltip(
                        escaparHTML(nome),
                        {
                            sticky: true
                        }
                    );

                    layer.on(
                        {
                            mouseover:
                                e => {
                                    e.target.setStyle(
                                        {
                                            weight: 1.8,
                                            color: "#315d78",
                                            fillOpacity: 0.56
                                        }
                                    );
                                },

                            mouseout:
                                e => {
                                    camadaMunicipiosEstado.resetStyle(
                                        e.target
                                    );
                                }
                        }
                    );
                }
        }
    ).addTo(
        mapaEstado
    );

    mapaEstado.fitBounds(
        camadaMunicipiosEstado.getBounds(),
        {
            padding: [5, 5]
        }
    );
}


async function atualizarGraficoDesempenho() {

    const linhas = await Promise.all(
        CONFIG.anos.map(
            ano => obterRegistroRS(ano)
        )
    );

    const anos = CONFIG.anos.map(
        String
    );

    function serie(campo) {
        return linhas.map(
            r =>
                r
                    ?
                    Number(r[campo])
                    :
                    null
        );
    }

    const traces = [

        {
            x: anos,
            y: serie("pab"),
            name: "Abaixo do Básico",
            type: "bar",
            marker: {
                color: CORES.abaixo
            },
            hovertemplate:
                "%{x}<br>Abaixo do Básico: %{y:.1f}%<extra></extra>"
        },

        {
            x: anos,
            y: serie("pb"),
            name: "Básico",
            type: "bar",
            marker: {
                color: CORES.basico
            },
            hovertemplate:
                "%{x}<br>Básico: %{y:.1f}%<extra></extra>"
        },

        {
            x: anos,
            y: serie("pad"),
            name: "Adequado",
            type: "bar",
            marker: {
                color: CORES.adequado
            },
            hovertemplate:
                "%{x}<br>Adequado: %{y:.1f}%<extra></extra>"
        },

        {
            x: anos,
            y: serie("pav"),
            name: "Avançado",
            type: "bar",
            marker: {
                color: CORES.avancado
            },
            hovertemplate:
                "%{x}<br>Avançado: %{y:.1f}%<extra></extra>"
        }

    ];

    const layout = {

        barmode: "stack",
        bargap: 0.27,

        margin: {
            l: 46,
            r: 12,
            t: 10,
            b: 48
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {
            family:
                "Inter, system-ui, sans-serif",
            size: 11,
            color: "#46535e"
        },

        xaxis: {
            fixedrange: true,
            title: "",
            tickfont: {
                size: 11
            }
        },

        yaxis: {
            range: [0, 100],
            fixedrange: true,
            ticksuffix: "%",
            gridcolor: "#e6eaed",
            zeroline: false
        },

        legend: {
            orientation: "h",
            x: 0,
            y: -0.17,
            xanchor: "left",
            font: {
                size: 10
            }
        }
    };

    Plotly.react(
        "grafico-desempenho",
        traces,
        layout,
        {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]
        }
    );
}


async function atualizarGraficoHistorico() {

    const linhas = await Promise.all(
        CONFIG.anos.map(
            ano => obterRegistroRS(ano)
        )
    );

    const anos = CONFIG.anos;

    const prof = linhas.map(
        r =>
            r
                ?
                Number(r.pm)
                :
                null
    );

    const part = linhas.map(
        r =>
            r
                ?
                Number(r.pp)
                :
                null
    );

    let meta = null;

    for (const r of linhas) {

        if (
            r
            &&
            r.m27 !== null
            &&
            r.m27 !== undefined
        ) {
            meta = Number(r.m27);
            break;
        }
    }

    const traces = [

        {
            x: anos,
            y: prof,
            name: "Proficiência média",
            type: "scatter",
            mode: "lines+markers",
            line: {
                color: CORES.proficiencia,
                width: 3
            },
            marker: {
                size: 8
            },
            hovertemplate:
                "%{x}<br>Proficiência: %{y:.1f}<extra></extra>"
        },

        {
            x: anos,
            y: part,
            name: "Participação",
            type: "scatter",
            mode: "lines+markers",
            yaxis: "y2",
            line: {
                color: CORES.participacao,
                width: 2
            },
            marker: {
                size: 7
            },
            hovertemplate:
                "%{x}<br>Participação: %{y:.1f}%<extra></extra>"
        }

    ];

    if (meta !== null) {

        traces.push(
            {
                x: [2022, 2025],
                y: [meta, meta],
                name: "Meta 2027",
                type: "scatter",
                mode: "lines",
                line: {
                    color: CORES.meta,
                    width: 2,
                    dash: "dash"
                },
                hovertemplate:
                    `Meta 2027: ${meta}<extra></extra>`
            }
        );

        document.getElementById(
            "historico-meta-info"
        ).textContent =
            `Meta estadual 2027: ${fmtInt(meta)}`;
    }

    else {

        document.getElementById(
            "historico-meta-info"
        ).textContent = "";
    }

    const layout = {

        margin: {
            l: 50,
            r: 54,
            t: 10,
            b: 42
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {
            family:
                "Inter, system-ui, sans-serif",
            size: 11,
            color: "#46535e"
        },

        xaxis: {
            tickmode: "array",
            tickvals: anos,
            fixedrange: true,
            gridcolor: "#edf0f2"
        },

        yaxis: {
            title: "Proficiência",
            fixedrange: true,
            gridcolor: "#e6eaed",
            zeroline: false
        },

        yaxis2: {
            title: "Participação (%)",
            overlaying: "y",
            side: "right",
            range: [0, 100],
            fixedrange: true,
            showgrid: false,
            ticksuffix: "%"
        },

        legend: {
            orientation: "h",
            x: 0,
            y: -0.15
        },

        shapes: [
            {
                type: "line",
                x0: ESTADO.ano,
                x1: ESTADO.ano,
                y0: 0,
                y1: 1,
                xref: "x",
                yref: "paper",
                line: {
                    color: "#9aa5ad",
                    width: 1,
                    dash: "dot"
                }
            }
        ]
    };

    Plotly.react(
        "grafico-historico",
        traces,
        layout,
        {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                "lasso2d",
                "select2d"
            ]
        }
    );
}


async function atualizarEstado() {

    atualizarDescricaoSelecao();

    const registro = await obterRegistroRS(
        ESTADO.ano
    );

    atualizarCards(
        registro
    );

    await Promise.all(
        [
            atualizarGraficoDesempenho(),
            atualizarGraficoHistorico()
        ]
    );
}


function lerFiltros() {

    ESTADO.ano = Number(
        document.getElementById(
            "filtro-ano"
        ).value
    );

    ESTADO.disciplina = document.getElementById(
        "filtro-disciplina"
    ).value;

    ESTADO.etapa = document.getElementById(
        "filtro-etapa"
    ).value;

    ESTADO.rede = document.getElementById(
        "filtro-rede"
    ).value;

    ESTADO.local = document.getElementById(
        "filtro-local"
    ).value;

    ESTADO.indicador = document.getElementById(
        "filtro-indicador"
    ).value;
}


function pararAnimacao() {

    if (ESTADO.timer) {
        clearInterval(
            ESTADO.timer
        );
    }

    ESTADO.timer = null;
    ESTADO.animando = false;

    document.getElementById(
        "btn-animar"
    ).classList.remove(
        "ativo"
    );

    document.getElementById(
        "texto-animar"
    ).textContent =
        "Animar 2022–2025";
}


async function atualizarTudo() {

    if (ESTADO.aba === "estado") {
        await atualizarEstado();
    }
}


function iniciarAnimacao() {

    if (ESTADO.animando) {
        pararAnimacao();
        return;
    }

    ESTADO.animando = true;

    document.getElementById(
        "btn-animar"
    ).classList.add(
        "ativo"
    );

    document.getElementById(
        "texto-animar"
    ).textContent =
        "Parar animação";

    let indice = CONFIG.anos.indexOf(
        ESTADO.ano
    );

    if (indice < 0) {
        indice = 0;
    }

    ESTADO.timer = setInterval(
        async () => {

            indice = (
                indice + 1
            ) % CONFIG.anos.length;

            const ano = CONFIG.anos[
                indice
            ];

            ESTADO.ano = ano;

            document.getElementById(
                "filtro-ano"
            ).value = String(
                ano
            );

            await atualizarTudo();

        },
        1600
    );
}


function ativarAba(nome) {

    ESTADO.aba = nome;

    document
        .querySelectorAll(
            ".aba"
        )
        .forEach(
            btn => {
                btn.classList.toggle(
                    "ativa",
                    btn.dataset.aba === nome
                );
            }
        );

    document
        .querySelectorAll(
            ".painel-aba"
        )
        .forEach(
            painel => {
                painel.classList.toggle(
                    "ativa",
                    painel.id === `aba-${nome}`
                );
            }
        );

    if (
        nome === "estado"
        &&
        mapaEstado
    ) {

        setTimeout(
            () => {
                mapaEstado.invalidateSize();
            },
            60
        );
    }
}


function registrarEventos() {

    const filtros = [
        "filtro-ano",
        "filtro-disciplina",
        "filtro-etapa",
        "filtro-rede",
        "filtro-local",
        "filtro-indicador"
    ];

    for (const id of filtros) {

        document.getElementById(
            id
        ).addEventListener(
            "change",
            async () => {

                pararAnimacao();

                lerFiltros();

                await atualizarTudo();
            }
        );
    }

    document.getElementById(
        "btn-animar"
    ).addEventListener(
        "click",
        () => {
            iniciarAnimacao();
        }
    );

    document
        .querySelectorAll(
            ".aba"
        )
        .forEach(
            btn => {

                btn.addEventListener(
                    "click",
                    () => {

                        pararAnimacao();

                        ativarAba(
                            btn.dataset.aba
                        );
                    }
                );
            }
        );
}


async function inicializar() {

    try {

        [
            CACHE.manifest,
            CACHE.schemas,
            CACHE.metadados,
            CACHE.mapas.municipios
        ] = await Promise.all(
            [
                fetchJSON(
                    "dados/manifest.json"
                ),

                fetchJSON(
                    "dados/schemas.json"
                ),

                fetchJSON(
                    "dados/metadados.json"
                ),

                fetchJSON(
                    "mapas/municipios_rs_saers.geojson"
                )
            ]
        );

        if (
            CACHE.manifest.versao !== "06B.3"
        ) {
            throw new Error(
                "Versão analítica inesperada."
            );
        }

        registrarEventos();

        lerFiltros();

        inicializarMapaEstado();

        await atualizarEstado();

        document.getElementById(
            "loading-global"
        ).classList.add(
            "oculto"
        );
    }

    catch (erro) {

        console.error(
            erro
        );

        const loading = document.getElementById(
            "loading-global"
        );

        loading.innerHTML = `
            <div class="loading-card">
                <strong>Erro ao carregar o painel</strong>
                <span>${escaparHTML(erro.message)}</span>
            </div>
        `;
    }
}


window.addEventListener(
    "DOMContentLoaded",
    inicializar
);
