const cache = new Map();

function getJSON(caminho) {
  if (!cache.has(caminho)) {
    cache.set(
      caminho,
      fetch(`/data/${caminho}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} em ${caminho}`);
          return r.json();
        })
        .catch((erro) => {
          cache.delete(caminho); // permite nova tentativa
          throw erro;
        })
    );
  }
  return cache.get(caminho);
}

const normalizar = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const palavrasIgnoradas = new Set([
  "a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos",
  "e", "em", "entre", "este", "esta", "isso", "na", "nas", "no", "nos",
  "o", "os", "ou", "para", "pela", "pelas", "pelo", "pelos", "por", "qual",
  "que", "se", "sem", "sobre", "um", "uma", "umas", "uns",
]);

const normalizarTermo = (termo) =>
  termo.replace(/oes$/u, "ao").replace(/(?:es|s)$/u, "");

function textoDosCampos(tutorial) {
  const campos = [
    [6, [tutorial.titulo]],
    [2, [tutorial.categoria]],
    [4, [...(tutorial.tags ?? []), ...(tutorial.sinonimos ?? [])]],
    [3, [tutorial.resumo]],
    [3, [...(tutorial.sintomas ?? []), ...(tutorial.perguntas_triagem ?? [])]],
    [2, [...(tutorial.materiais ?? []), ...(tutorial.avisos ?? [])]],
    [
      1,
      (tutorial.passos ?? []).flatMap((passo) => [passo.titulo, passo.texto]),
    ],
    [
      3,
      (tutorial.videos ?? []).flatMap((video) => [video.titulo, video.canal]),
    ],
  ];

  return campos.map(([peso, valores]) => ({
    peso,
    texto: normalizar(valores.filter(Boolean).join(" ")),
  }));
}

export const api = {
  indice: () => getJSON("index.json"),
  tutorial: (slug) => getJSON(`tutoriais/${slug}.json`),

  async buscar(texto) {
    const consulta = normalizar(texto);
    const termos = [
      ...new Set(
        consulta
          .split(/\s+/)
          .filter((termo) => termo.length > 1 && !palavrasIgnoradas.has(termo))
          .map(normalizarTermo)
      ),
    ];
    if (!termos.length) return [];

    const { tutoriais } = await this.indice();
    return tutoriais
      .map((tutorial, ordem) => {
        const campos = textoDosCampos(tutorial);
        const correspondencias = termos.filter((termo) =>
          campos.some((campo) => campo.texto.includes(termo))
        );
        const pontos = correspondencias.reduce(
          (total, termo) =>
            total +
            campos.reduce(
              (soma, campo) => soma + (campo.texto.includes(termo) ? campo.peso : 0),
              0
            ),
          0
        );
        const frase = consulta.length > 2
          ? campos.reduce(
              (soma, campo) => soma + (campo.texto.includes(consulta) ? campo.peso * 2 : 0),
              0
            )
          : 0;
        return { slug: tutorial.slug, pontos: pontos + frase, ordem, termos: correspondencias.length };
      })
      .filter((resultado) => resultado.termos >= Math.min(2, termos.length))
      .sort((a, b) => b.pontos - a.pontos || a.ordem - b.ordem)
      .map((resultado) => resultado.slug);
  },
};