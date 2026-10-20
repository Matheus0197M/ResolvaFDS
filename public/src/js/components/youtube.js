import { h } from "../dom.js";

export function VideoCard({ id, titulo, canal, inicio = 0 }) {
  const botao = h(
    "button",
    { class: "video__play", type: "button", "aria-label": `Reproduzir: ${titulo}` },
    h("img", { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: "", loading: "lazy" })
  );

  const palco = h("div", { class: "video__palco" }, botao);

  botao.addEventListener(
    "click",
    () => {
      palco.replaceChildren(
        h("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&start=${inicio}`,
          title: titulo,
          allow: "autoplay; encrypted-media; picture-in-picture",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          allowfullscreen: "",
        })
      );
    },
    { once: true }
  );

  return h(
    "figure",
    { class: "video" },
    palco,
    h("figcaption", {}, titulo, canal ? ` · ${canal}` : "")
  );
}