(function setupApiClient() {
    // URL del backend en producción (Render). Cámbiala por la URL real de tu servicio.
    const PRODUCTION_API_URL = "https://TU-BACKEND.onrender.com";
    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
        || window.location.protocol === "file:";
    const baseUrl = (window.SOCIALHOURS_API_URL
        || (isLocalhost ? "http://localhost:3000" : PRODUCTION_API_URL)).replace(/\/+$/, "");
    window.SOCIALHOURS_API_BASE = baseUrl;

    window.socialHoursApi = {
        async request(path, options = {}) {
            const token = localStorage.getItem("socialhours_token");
            const headers = new Headers(options.headers || {});
            if (options.body && !headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
            if (token && !headers.has("Authorization")) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), options.timeout || 60000);
            let response;
            try {
                response = await fetch(`${baseUrl}${path}`, {
                    ...options,
                    headers,
                    credentials: "include",
                    signal: controller.signal,
                });
            } catch (error) {
                if (error.name === "AbortError") {
                    throw new Error("El servidor tardó demasiado en responder");
                }
                throw new Error("No se pudo conectar con el servidor");
            } finally {
                window.clearTimeout(timeout);
            }
            const data = response.status === 204
                ? null
                : await response.json().catch(() => ({ error: "El servidor devolvió una respuesta no válida" }));
            if (!response.ok) {
                throw new Error(data?.error || "No fue posible completar la solicitud");
            }
            return data;
        },
    };

    window.setButtonBusy = (button, busy, busyText = "Procesando...") => {
        if (!button) return;
        if (busy) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = busyText;
            button.setAttribute("aria-busy", "true");
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
            button.removeAttribute("aria-busy");
        }
    };
})();
