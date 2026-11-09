# SAERS — Painel Histórico 2022–2025

Painel histórico e territorial do **Sistema de Avaliação do Rendimento Escolar do Rio Grande do Sul (SAERS)**.

## Cobertura

O produto reúne resultados analíticos das edições de:

- 2022
- 2023
- 2024
- 2025

Abrangências:

- Rio Grande do Sul
- 30 Coordenadorias Regionais de Educação (CREs)
- 497 municípios
- 5.176 escolas

Disciplinas:

- Língua Portuguesa
- Matemática

Etapas:

- 2º ano do Ensino Fundamental
- 5º ano do Ensino Fundamental
- 9º ano do Ensino Fundamental
- 3ª série do Ensino Médio

## Estrutura do repositório

```text
/
├── index.html
├── styles.css
├── app.js
├── README.md
├── .nojekyll
│
├── dados/
│   ├── manifest.json
│   ├── metadados.json
│   ├── schemas.json
│   ├── rs/
│   ├── cre/
│   ├── municipio/
│   ├── escola/
│   └── escola_filtros/
│
├── mapas/
│   ├── cres_rs_saers.geojson
│   ├── municipios_rs_saers.geojson
│   └── escolas_rs_saers.geojson
│
├── docs/
│   ├── fontes.md
│   └── metodologia.md
│
└── auditoria/
```

## Dados analíticos

A publicação web utiliza formato matricial otimizado e validado como **lossless**.

- 200.149 registros analíticos publicados;
- 16 arquivos analíticos;
- 32,71 MB na versão otimizada;
- zero divergências em relação à versão tabular validada;
- maior JSON analítico: aproximadamente 4,27 MB.

Os microdados individuais de estudantes **não são republicados neste repositório**.

## Fonte oficial

Secretaria de Estado da Educação do Rio Grande do Sul.

**Dados do Sistema de Avaliação do Rendimento Escolar do Rio Grande do Sul — SAERS**

https://dados.rs.gov.br/dataset/dados-sistema-de-avaliacao-do-rendimento-escolar-do-rio-grande-do-sul-saers

## Observação sobre as metas de 2027

As metas de proficiência de 2027 são apresentadas no painel exclusivamente como referência estadual da Rede Estadual e não são interpretadas como metas individuais de CRE, município ou escola.
