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
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const api = {
  indice: () => getJSON("index.json"),
  tutorial: (slug) => getJSON(`tutoriais/${slug}.json`),

  // Interface estável: hoje busca léxica, amanhã IA, mesma assinatura.
  async buscar(texto) {
    const termos = normalizar(texto).split(/\s+/).filter(Boolean);
    const { tutoriais } = await this.indice();
    return tutoriais
      .filter((t) => {
        const alvo = normalizar(
          [t.titulo, t.resumo, ...(t.tags ?? []), ...(t.sinonimos ?? [])].join(" ")
        );
        return termos.every((termo) => alvo.includes(termo));
      })
      .map((t) => t.slug);
  },
};