const STUDENTS_KEY = "socialhours_registered_students";
const HOURS_KEY = "socialhours_submissions";
const LEGACY_HOURS_KEY = "socialhours_registered_hours";
const recordsBody = document.getElementById("allRecordsBody");
const searchInput = document.getElementById("recordSearch");
const dateOrder = document.getElementById("dateOrder");

function readList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error(`No se pudo leer ${key}:`, error);
        return [];
    }
}

function renderNotifications() {
    const notificationsList = document.getElementById("notificationsList");
    if (!notificationsList) {
        return;
    }

    try {
        const notifications = JSON.parse(localStorage.getItem("socialhours_notifications") || "[]");
        const list = Array.isArray(notifications) ? notifications : [];

        if (!list.length) {
            notificationsList.innerHTML = '<li class="notification-empty">No hay notificaciones.</li>';
            return;
        }

        notificationsList.innerHTML = list.slice(0, 6).map((notification) => `
            <li class="notification-item">
                <span class="notification-dot" aria-hidden="true"></span>
                <p>${notification.text || "Notificación"}</p>
            </li>
        `).join("");
    } catch (error) {
        console.warn("No se pudieron cargar las notificaciones:", error);
        notificationsList.innerHTML = '<li class="notification-empty">No hay notificaciones.</li>';
    }
}

function getRecords() {
    const entries = [...readList(HOURS_KEY), ...readList(LEGACY_HOURS_KEY)];
    return entries.filter((entry, index, list) => {
        const key = entry.id || `${entry.studentName}-${entry.date}-${entry.hours}`;
        return list.findIndex((candidate) =>
            (candidate.id || `${candidate.studentName}-${candidate.date}-${candidate.hours}`) === key
        ) === index;
    });
}

function render() {
    const term = searchInput.value.trim().toLowerCase();
    const students = readList(STUDENTS_KEY);
    const direction = dateOrder.value === "asc" ? 1 : -1;
    const records = getRecords()
        .filter((entry) =>
            String(entry.studentName || "").toLowerCase().includes(term) ||
            String(entry.literacyPlace || "").toLowerCase().includes(term)
        )
        .sort((first, second) =>
            direction * (new Date(first.date || first.createdAt || 0) - new Date(second.date || second.createdAt || 0))
        );

    recordsBody.innerHTML = records.length ? records.map((entry) => {
        const student = students.find((item) =>
            `${item.nombre || ""} ${item.apellido || ""}`.trim().toLowerCase() ===
            (entry.studentName || "").trim().toLowerCase()
        ) || {};
        const status = entry.status === "aprobada" ? "Aprobado" : (entry.status || "Pendiente");
        return `
            <tr>
                <td>${entry.studentName || "Sin nombre"}</td>
                <td>${student.grado || "—"}</td>
                <td>${student.grupo || "—"}</td>
                <td>${entry.literacyPlace || "—"}</td>
                <td>${Number(entry.hours || 0)}</td>
                <td>${status}</td>
                <td>${entry.date || "—"}</td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="7" style="text-align:center; padding:1rem;">No hay registros.</td></tr>`;
}

searchInput.addEventListener("input", render);
dateOrder.addEventListener("change", render);
window.addEventListener("storage", () => {
    render();
    renderNotifications();
});

function setupLogoutConfirmation() {
    const logoutButton = document.getElementById("logoutBtn");
    if (!logoutButton) return;

    let modal = document.getElementById("logoutConfirmationModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "logoutConfirmationModal";
        modal.innerHTML = `
            <style>
                #logoutConfirmationModal { display: none; }
                #logoutConfirmationModal.show { display: block; }
                .logout-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .logout-modal-card {
                    width: min(420px, calc(100vw - 32px));
                    background: #fff;
                    border-radius: 18px;
                    padding: 24px 22px;
                    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
                }
                .logout-modal-card h3 { margin: 0 0 12px; font-size: 22px; color: #111827; }
                .logout-modal-card p { margin: 0 0 20px; color: #475569; font-size: 16px; }
                .logout-modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
                .logout-modal-actions button {
                    border: none; border-radius: 10px; padding: 10px 18px; font-weight: 600; cursor: pointer;
                }
                .logout-cancel-btn { background: #e2e8f0; color: #1f2937; }
                .logout-confirm-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; }
            </style>
            <div class="logout-modal-backdrop">
                <div class="logout-modal-card" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
                    <h3 id="logoutModalTitle">Cerrar sesión</h3>
                    <p>¿Seguro que quieres cerrar sesión?</p>
                    <div class="logout-modal-actions">
                        <button type="button" class="logout-cancel-btn">Rechazar</button>
                        <button type="button" class="logout-confirm-btn">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const confirmBtn = modal.querySelector(".logout-confirm-btn");
    const cancelBtn = modal.querySelector(".logout-cancel-btn");

    logoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        modal.classList.add("show");
    });

    cancelBtn.addEventListener("click", () => modal.classList.remove("show"));
    confirmBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        localStorage.removeItem("socialhours_token");
        localStorage.removeItem("socialhours_user");
        localStorage.setItem("socialhours_logout", String(Date.now()));
        window.location.href = "../login/inicio_sesion.html";
    });
}
setupLogoutConfirmation();

render();
renderNotifications();
