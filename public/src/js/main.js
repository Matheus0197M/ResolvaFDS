import { api } from "./api.js";
import { h } from "./dom.js";
import { Tutorial } from "./components/tutorial.js";

const app = document.getElementById("app");
const botaoVoltar = document.getElementById("botao-voltar");
const acoesVoltar = document.querySelector(".conteudo-principal__acoes");
const menuToggle = document.getElementById("menu-toggle");
const menuPainel = document.getElementById("menu-principal");
const menuScrim = document.getElementById("menu-scrim");
const rotaInicial = location.hash || "#/home";
const historicoRotas = [];
let rotaAtual = rotaInicial;
let navegandoParaTras = false;

const cartaoTutorial = (t) =>
  h(
    "li",
    {},
    h(
      "article",
      { class: "solucao-card" },
      h(
        "a",
        { class: "solucao-card__link", href: `#/tutorial/${t.slug}` },
        h(
          "div",
          { class: "solucao-card__texto" },
          h("strong", {}, t.titulo),
          h("p", {}, t.resumo)
        ),
        h(
          "span",
          { class: "solucao-card__seta", "aria-hidden": "true" },
          h("img", {
            class: "solucao-card__icone",
            src: "./assets/angle-right-solid-full.svg",
            alt: "",
          })
        )
      )
    )
  );

const views = {
  async home() {
    const { categorias } = await api.indice();
    return h(
      "section",
      { class: "pagina pagina--categorias" },
      h("h1", { class: "pagina__titulo" }, "Onde está seu problema?"),
      h(
        "ul",
        { class: "grade-categorias" },
        ...categorias.map((c) =>
          h(
            "li",
            { class: "categoria-card" },
            h(
              "a",
              { href: `#/categoria/${c.id}` },
              h("img", { src: c.icone, alt: "", loading: "lazy" }),
              h("p", {}, c.nome)
            )
          )
        )
      )
    );
  },
  async categoria(id) {
    const { categorias, tutoriais } = await api.indice();
    const categoria = categorias.find((c) => c.id === id);
    return h(
      "section",
      { class: "pagina pagina--tutoriais" },
      h("h1", { class: "pagina__titulo" }, categoria?.nome ?? "Tutoriais"),
      h(
        "ul",
        { class: "grade-tutoriais" },
        ...tutoriais.filter((t) => t.categoria === id).map(cartaoTutorial)
      )
    );
  },
  async tutorial(slug) {
    return Tutorial(await api.tutorial(slug));
  },
  async busca(texto) {
    const slugs = await api.buscar(decodeURIComponent(texto));
    const { tutoriais } = await api.indice();
    const porSlug = new Map(tutoriais.map((t) => [t.slug, t]));
    const achados = slugs.map((slug) => porSlug.get(slug)).filter(Boolean);
    return achados.length
      ? h(
          "section",
          { class: "pagina pagina--tutoriais" },
          h("h1", { class: "pagina__titulo" }, "Resultados da busca"),
          h("ul", { class: "grade-tutoriais" }, ...achados.map(cartaoTutorial))
        )
      : h(
          "p",
          { class: "mensagem-vazia" },
          "Nada encontrado. Tente buscar por problema, sintoma, material ou etapa."
        );
  },
};

function atualizarEstadoDoMenu(aberto) {
  menuToggle.setAttribute("aria-expanded", String(aberto));
  menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  menuToggle.querySelector("img").src = aberto
    ? "./assets/bars-solid-full.svg"
    : "./assets/bars-staggered-solid-full.svg";
  menuPainel.hidden = !aberto;
  menuScrim.hidden = !aberto;
  document.body.classList.toggle("menu-aberto", aberto);
}

function atualizarBotaoVoltar() {
  acoesVoltar.hidden = rotaAtual === "#/home";
  botaoVoltar.disabled = historicoRotas.length === 0;
}

function voltar() {
  const destino = historicoRotas.pop();
  if (!destino) return;
  navegandoParaTras = true;
  location.hash = destino;
  atualizarBotaoVoltar();
}

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  localStorage.setItem("tema", tema);
  document.querySelectorAll("[data-tema]").forEach((botao) => {
    botao.setAttribute("aria-pressed", String(botao.dataset.tema === tema));
  });
}

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

const temaSalvo = localStorage.getItem("tema");
aplicarTema(temaSalvo === "dark" ? "dark" : "light");

botaoVoltar.addEventListener("click", voltar);
menuToggle.addEventListener("click", () => {
  atualizarEstadoDoMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

menuScrim.addEventListener("click", () => atualizarEstadoDoMenu(false));

document.getElementById("menu-inicio").addEventListener("click", () => {
  atualizarEstadoDoMenu(false);
});

document.querySelectorAll("[data-tema]").forEach((botao) => {
  botao.addEventListener("click", () => aplicarTema(botao.dataset.tema));
});

document.addEventListener("click", (evento) => {
  if (!evento.target.closest(".menu")) atualizarEstadoDoMenu(false);
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") atualizarEstadoDoMenu(false);
});

atualizarBotaoVoltar();

// Busca: intercepta o form em vez de usar POST
document.querySelector("form[role=search]")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = String(new FormData(e.target).get("q") ?? "").trim();
  if (texto) {
    location.hash = `#/busca/${encodeURIComponent(texto)}`;
    atualizarEstadoDoMenu(false);
  }
});

addEventListener("hashchange", () => {
  const novaRota = location.hash || "#/home";
  if (novaRota !== rotaAtual) {
    if (navegandoParaTras) {
      navegandoParaTras = false;
    } else {
      const indiceAnterior = historicoRotas.lastIndexOf(novaRota);
      if (indiceAnterior >= 0) historicoRotas.splice(indiceAnterior);
      else historicoRotas.push(rotaAtual);
    }
    rotaAtual = novaRota;
    atualizarBotaoVoltar();
  }
  atualizarEstadoDoMenu(false);
  rotear();
});
rotear();