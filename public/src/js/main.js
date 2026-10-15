import { api } from "./api.js";
import { h } from "./dom.js";
import { Tutorial } from "./components/tutorial.js";

const app = document.getElementById("app");

const cartaoTutorial = (t) =>
  h("li", {}, h("a", { href: `#/tutorial/${t.slug}` }, h("strong", {}, t.titulo), h("p", {}, t.resumo)));

const views = {
  async home() {
    const { categorias } = await api.indice();
    return h("section", {}, h("h1", {}, "Onde se encontra seu problema?"),
      h("ul", {}, ...categorias.map((c) =>
        h("li", {}, h("a", { href: `#/categoria/${c.id}` },
          h("img", { src: c.icone, alt: "" }), h("p", {}, c.nome))))));
  },
  async categoria(id) {
    const { tutoriais } = await api.indice();
    return h("ul", {}, ...tutoriais.filter((t) => t.categoria === id).map(cartaoTutorial));
  },
  async tutorial(slug) {
    return Tutorial(await api.tutorial(slug));
  },
  async busca(texto) {
    const slugs = new Set(await api.buscar(decodeURIComponent(texto)));
    const { tutoriais } = await api.indice();
    const achados = tutoriais.filter((t) => slugs.has(t.slug));
    return achados.length
      ? h("ul", {}, ...achados.map(cartaoTutorial))
      : h("p", {}, "Nada encontrado. Tente outras palavras.");
  },
};

async function rotear() {
  const [, nome = "home", arg] = location.hash.slice(1).split("/");
  const view = views[nome] ?? views.home;
  app.setAttribute("aria-busy", "true");
  try {
    app.replaceChildren(await view(arg));
    app.focus(); // acessibilidade: leva o foco ao novo conteúdo
    window.scrollTo(0, 0);
  } catch (erro) {
    console.error(erro);
    app.replaceChildren(h("p", { role: "alert" }, "Não foi possível carregar este conteúdo."));
  } finally {
    app.removeAttribute("aria-busy");
  }
}

// Busca: intercepta o form em vez de usar POST
document.querySelector("form[role=search]")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = new FormData(e.target).get("q").trim();
  if (texto) location.hash = `#/busca/${encodeURIComponent(texto)}`;
});

addEventListener("hashchange", rotear);
rotear();