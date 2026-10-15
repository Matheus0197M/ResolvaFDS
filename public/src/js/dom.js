export function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (chave === "class") el.className = valor;
    else if (chave.startsWith("on")) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor);
  }
  // Strings viram nós de texto: seguro contra XSS
  el.append(...filhos.flat().filter((f) => f != null && f !== false));
  return el;
}