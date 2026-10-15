import { h } from "../dom.js";
import { VideoCard } from "./youtube.js";

const secao = (titulo, ...conteudo) =>
  h("section", { class: "tutorial__secao" }, h("h2", {}, titulo), ...conteudo);

export function Tutorial(t) {
  const { avisos = [], materiais = [], passos = [], videos = [] } = t;

  return h(
    "article",
    { class: "tutorial" },
    h("h1", {}, t.titulo),
    h("p", { class: "tutorial__resumo" }, t.resumo),
    t.tempo_min ? h("p", { class: "tutorial__meta" }, `${t.tempo_min} min · ${t.dificuldade}`) : null,
    avisos.length
      ? h("aside", { class: "aviso", role: "note" }, ...avisos.map((a) => h("p", {}, a)))
      : null,
    materiais.length
      ? secao("Materiais", h("ul", {}, ...materiais.map((m) => h("li", {}, m))))
      : null,
    secao(
      "Passo a passo",
      h(
        "ol",
        {},
        ...passos.map((p) =>
          h("li", {}, h("h3", {}, p.titulo), h("p", { class: "preservar-quebras" }, p.texto))
        // No CSS, adicione .preservar-quebras { white-space: pre-line; } para respeitar as quebras de linha do YAML sem usar innerHTML.
        )
      )
    ),
    videos.length ? secao("Vídeos relacionados", ...videos.map(VideoCard)) : null
  );
}