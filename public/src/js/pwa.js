if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const serviceWorkerUrl = new URL("../../service-worker.js", import.meta.url);
    navigator.serviceWorker.register(serviceWorkerUrl.href).catch((error) => {
      console.error("Falha ao registrar o service worker do aplicativo.", error);
    });
  });
}
