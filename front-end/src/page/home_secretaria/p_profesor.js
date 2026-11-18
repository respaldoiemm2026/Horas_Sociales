const token = localStorage.getItem("socialhours_token");
const userTitle = document.getElementById("userTitleText");
const logoutBtn = document.getElementById("logoutBtn");
const studentsGroupsContainer = document.getElementById("studentsGroupsContainer");
const studentsStat = document.querySelector(".card.card-gray .stat-number");
const historyTableBody = document.getElementById("historyTableBody");
const viewAllRecords = document.getElementById("viewAllRecords");
const toggleHistory = document.getElementById("toggleHistory");
const historyContent = document.getElementById("historyContent");
const studentRecordsTableBody = document.getElementById("studentRecordsTableBody");
const welcomeMessage = document.getElementById("welcomeMessage");
const totalStudentsStat = document.getElementById("totalStudentsStat");
const grade10Stat = document.getElementById("grade10Stat");
const grade11Stat = document.getElementById("grade11Stat");
const studentsWithHoursStat = document.getElementById("studentsWithHoursStat");
const pikachuTrigger = document.getElementById("pikachuTrigger");
const pikachuModal = document.getElementById("pikachuModal");
const pikachuScene = document.getElementById("pikachuScene");
const pikachuTitle = document.getElementById("pikachuTitle");
const pikachuBattle = document.getElementById("pikachuBattle");
const pikachuImages = document.querySelectorAll(".pikachu-image");
const closePikachuBtn = document.getElementById("closePikachuBtn");
const pikachuCanvas = document.getElementById("pikachuCanvas");
const pikachuAttackBtn = document.getElementById("pikachuAttackBtn");
const pikachuInvasionBtn = document.getElementById("pikachuInvasionBtn");
const pikachuFullscreenBtn = document.getElementById("pikachuFullscreenBtn");
const pikachuInvasion = document.getElementById("pikachuInvasion");
const footerInfoModal = document.getElementById("footerInfoModal");
const closeFooterInfoBtn = document.getElementById("closeFooterInfoBtn");
const footerInfoTitle = document.getElementById("footerInfoTitle");
const footerInfoContent = document.getElementById("footerInfoContent");
const STUDENTS_STORAGE_KEY = "socialhours_registered_students";
const HOURS_STORAGE_KEY = "socialhours_submissions";
const LEGACY_HOURS_STORAGE_KEY = "socialhours_registered_hours";
const NOTIFICATIONS_STORAGE_KEY = "socialhours_notifications";
const REQUIRED_HOURS = 80;

let pikachuTimeout;
let pikachuAnimationFrame;
let pikachuParticles = [];

function resizePikachuCanvas() {
    if (!pikachuCanvas) return;
    const bounds = pikachuCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    pikachuCanvas.width = Math.max(1, Math.floor(bounds.width * ratio));
    pikachuCanvas.height = Math.max(1, Math.floor(bounds.height * ratio));
}

function launchPikachuParticles(intense = false) {
    if (!pikachuCanvas) return;
    const bounds = pikachuCanvas.getBoundingClientRect();
    const amount = intense ? 42 : 12;
    for (let index = 0; index < amount; index += 1) {
        pikachuParticles.push({
            x: bounds.width / 2 + (Math.random() - 0.5) * 180,
            y: bounds.height * 0.58 + (Math.random() - 0.5) * 120,
            vx: (Math.random() - 0.5) * (intense ? 8 : 3),
            vy: -Math.random() * (intense ? 8 : 3) - 1,
            life: 1,
            size: Math.random() * (intense ? 5 : 3) + 2,
            hue: Math.random() > 0.25 ? "#fff27d" : "#baf4ff"
        });
    }
}

function animatePikachuParticles() {
    if (!pikachuCanvas) return;
    const context = pikachuCanvas.getContext("2d");
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const width = pikachuCanvas.width / ratio;
    const height = pikachuCanvas.height / ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (pikachuModal?.classList.contains("is-open") && Math.random() < 0.22) {
        launchPikachuParticles(false);
    }

    pikachuParticles = pikachuParticles.filter((particle) => particle.life > 0 && particle.y > -20);
    pikachuParticles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.08;
        particle.life -= 0.018;
        context.globalAlpha = Math.max(0, particle.life);
        context.shadowBlur = 18;
        context.shadowColor = particle.hue;
        context.fillStyle = particle.hue;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fill();
    });
    context.globalAlpha = 1;
    pikachuAnimationFrame = window.requestAnimationFrame(animatePikachuParticles);
}

function triggerPikachuAttack() {
    if (!pikachuScene) return;
    pikachuScene.className = "pikachu-scene pika-attack";
    pikachuTitle.textContent = "¡Impactrueno! ¡Rayos por toda la pantalla!";
    pikachuBattle?.setAttribute("aria-hidden", "false");
    pikachuBattle && (pikachuBattle.textContent = "⚡ ATAQUE ELÉCTRICO ⚡");
    launchPikachuParticles(true);
    window.clearTimeout(pikachuTimeout);
    pikachuTimeout = window.setTimeout(closePikachuModal, 4200);
}

function createPikachuInvasion() {
    if (!pikachuInvasion) return;
    pikachuInvasion.replaceChildren();
    const source = pikachuImages[0]?.getAttribute("src");
    if (!source) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 26; index += 1) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.className = "pikachu-invasion-pika";
        image.style.left = `${Math.random() * 94}%`;
        image.style.top = `${Math.random() * 92}%`;
        image.style.setProperty("--invasion-duration", `${2.2 + Math.random() * 2.8}s`);
        image.style.setProperty("--invasion-delay", `${Math.random() * -3}s`);
        image.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(${0.65 + Math.random() * 0.8})`;
        fragment.appendChild(image);
    }
    ["corner-left", "corner-right", "corner-top"].forEach((corner, index) => {
        const image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.className = `pikachu-invasion-pika ${corner}`;
        image.style.setProperty("--invasion-duration", `${2.4 + index * 0.4}s`);
        image.style.setProperty("--invasion-delay", `${index * -0.45}s`);
        fragment.appendChild(image);
    });
    pikachuInvasion.appendChild(fragment);
}

function triggerPikachuInvasion() {
    if (!pikachuScene) return;
    createPikachuInvasion();
    pikachuScene.className = "pikachu-scene pika-invasion";
    pikachuTitle.textContent = "¡Invasión Pikachu! ¡La pantalla está completamente desbordada!";
    pikachuBattle?.setAttribute("aria-hidden", "false");
    pikachuBattle && (pikachuBattle.textContent = "👾 ¡INVASIÓN PIKACHU! 👾");
    launchPikachuParticles(true);
    window.clearTimeout(pikachuTimeout);
    pikachuTimeout = window.setTimeout(closePikachuModal, 6200);
}

function closePikachuModal() {
    if (!pikachuModal) return;
    window.clearTimeout(pikachuTimeout);
    pikachuModal.classList.remove("is-open");
    pikachuModal.classList.remove("is-fullscreen");
    pikachuModal.setAttribute("aria-hidden", "true");
    pikachuBattle?.setAttribute("aria-hidden", "true");
    pikachuInvasion?.replaceChildren();
}

const pikachuScenes = [
    { className: "pika-jumpscare", message: "¡Pika Pika!", duration: 2100 },
    { className: "pika-dance", message: "¡Pikachu rompe la página!", duration: 3900 },
    { className: "pika-overload", message: "Pikachu.exe dejó de funcionar.", duration: 3600 },
    { className: "pika-confused", message: "¿Tú también encontraste el botón?", duration: 3600 },
    { className: "pika-secret", message: "No debiste hacer clic aquí.", duration: 3300 },
    { className: "pika-battle", message: "¡Pikachu salvaje apareció!", duration: 3300 },
    { className: "pika-anticlimax", message: "Pika.", duration: 3900 },
    { className: "pika-discovered", message: "Sé que hiciste clic.", duration: 3600 }
];

function playPikachuScene() {
    if (!pikachuModal || !pikachuScene || !pikachuTitle) return;
    const scene = pikachuScenes[Math.floor(Math.random() * pikachuScenes.length)];
    pikachuScene.className = `pikachu-scene ${scene.className}`;
    pikachuScene.getBoundingClientRect();
    pikachuTitle.textContent = scene.message;
    resizePikachuCanvas();
    launchPikachuParticles(scene.className === "pika-battle" || scene.className === "pika-overload");
    if (pikachuBattle) {
        pikachuBattle.setAttribute("aria-hidden", scene.className === "pika-battle" ? "false" : "true");
    }

    pikachuImages.forEach((image) => {
        image.addEventListener("error", () => {
            image.hidden = true;
        });
    });
    pikachuModal.classList.add("is-open");
    pikachuModal.setAttribute("aria-hidden", "false");
    pikachuTimeout = window.setTimeout(closePikachuModal, scene.duration);
}

if (pikachuTrigger && pikachuModal) {
    pikachuTrigger.addEventListener("click", () => {
        playPikachuScene();
    });

    closePikachuBtn?.addEventListener("click", closePikachuModal);
    pikachuModal.addEventListener("click", (event) => {
        if (event.target === pikachuModal) closePikachuModal();
    });

    pikachuAttackBtn?.addEventListener("click", triggerPikachuAttack);
    pikachuInvasionBtn?.addEventListener("click", triggerPikachuInvasion);
    pikachuImages.forEach((image) => {
        image.addEventListener("click", triggerPikachuInvasion);
    });
    pikachuFullscreenBtn?.addEventListener("click", () => {
        pikachuModal.classList.toggle("is-fullscreen");
        pikachuFullscreenBtn.textContent = pikachuModal.classList.contains("is-fullscreen")
            ? "⤢ Restaurar tamaño"
            : "⛶ Pantalla completa";
        resizePikachuCanvas();
    });

    window.addEventListener("resize", resizePikachuCanvas);
    resizePikachuCanvas();
    animatePikachuParticles();
}

function closeFooterInfoModal() {
    if (!footerInfoModal) return;
    footerInfoModal.classList.remove("is-open");
    footerInfoModal.setAttribute("aria-hidden", "true");
}

if (footerInfoModal && footerInfoTitle && footerInfoContent) {
    document.querySelectorAll("[data-footer-title]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            footerInfoTitle.textContent = link.dataset.footerTitle || "";
            footerInfoContent.textContent = link.dataset.footerContent || "";
            footerInfoModal.classList.add("is-open");
            footerInfoModal.setAttribute("aria-hidden", "false");
        });
    });

    closeFooterInfoBtn?.addEventListener("click", closeFooterInfoModal);
    footerInfoModal.addEventListener("click", (event) => {
        if (event.target === footerInfoModal) closeFooterInfoModal();
    });
}

function matchesSearch(value, searchTerm) {
    return !searchTerm || String(value || "").toLowerCase().includes(searchTerm);
}

function getNotifications() {
    try {
        const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || "[]");
        return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
        console.warn("No se pudieron cargar las notificaciones:", error);
        return [];
    }
}

function renderNotifications() {
    const notificationsList = document.getElementById("notificationsList");
    if (!notificationsList) {
        return;
    }

    const notifications = getNotifications();
    if (!notifications.length) {
        notificationsList.innerHTML = '<li class="notification-empty">No hay notificaciones.</li>';
        return;
    }

    notificationsList.innerHTML = notifications.slice(0, 8).map((notification) => `
        <li class="notification-item">
            <span class="notification-dot" aria-hidden="true"></span>
            <p>${notification.text || "Notificación"}</p>
        </li>
    `).join("");
}

function addNotification(message) {
    const messageText = String(message || "").trim();
    if (!messageText) {
        return;
    }

    function showPasswordReminder() {
        const loggedUser = JSON.parse(localStorage.getItem("socialhours_user") || "null");
        const role = Number(loggedUser?.id_rol ?? loggedUser?.rol ?? 0);
        const identity = loggedUser?.id || loggedUser?.email;
        if (role !== 3 || !identity) return;

        const reminderKey = `socialhours_password_reminder:${String(identity).trim().toLowerCase()}`;
        if (localStorage.getItem(reminderKey)) return;

        const reminder = document.createElement("div");
        reminder.textContent = "Recuerda cambiar tu contraseña después del primer acceso";
        reminder.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;padding:20px 28px;background:#1f2937;color:#fff;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.25);font-weight:600;text-align:center;";
        document.body.appendChild(reminder);
        localStorage.setItem(reminderKey, "1");
        setTimeout(() => reminder.remove(), 5000);
    }

    const notifications = getNotifications();
    notifications.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: messageText,
        createdAt: new Date().toISOString(),
    });

    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 10)));
    renderNotifications();
}

function getRegisteredStudents() {
    try {
        const students = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY) || "[]");
        return Array.isArray(students) ? students : [];
    } catch (error) {
        console.warn("No se pudieron cargar los estudiantes registrados:", error);
        return [];
    }
}

function getSubmissions() {
    try {
        const savedHours = JSON.parse(localStorage.getItem(HOURS_STORAGE_KEY) || "[]");
        const legacyHours = JSON.parse(localStorage.getItem(LEGACY_HOURS_STORAGE_KEY) || "[]");
        const merged = [...(Array.isArray(savedHours) ? savedHours : []), ...(Array.isArray(legacyHours) ? legacyHours : [])];
        const unique = merged.filter((item, index, array) => {
            const key = item.id || `${item.studentName}-${item.date}-${item.hours}`;
            return array.findIndex((candidate) => (candidate.id || `${candidate.studentName}-${candidate.date}-${candidate.hours}`) === key) === index;
        });
        return unique;
    } catch (error) {
        console.warn("No se pudieron cargar los registros de horas:", error);
        return [];
    }

    function removeOrphanSubmissions() {
        const activeStudents = getRegisteredStudents()
            .filter((student) => String(student.estado || "activo").toLowerCase() !== "retirado")
            .map((student) => `${student.nombre || ""} ${student.apellido || ""}`.trim().toLowerCase());
        const filterValid = (key) => {
            const entries = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(entries)) return [];
            return entries.filter((entry) =>
                activeStudents.includes(String(entry.studentName || "").trim().toLowerCase())
            );
        };
        localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(filterValid(HOURS_STORAGE_KEY)));
        localStorage.setItem(LEGACY_HOURS_STORAGE_KEY, JSON.stringify(filterValid(LEGACY_HOURS_STORAGE_KEY)));
    }
}

function renderHistoryTable(searchTerm = "") {
    if (!historyTableBody) {
        return;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const submissions = getSubmissions().filter((entry) =>
        matchesSearch(entry.studentName, normalizedSearch) ||
        matchesSearch(entry.literacyPlace, normalizedSearch)
    ).sort((first, second) => new Date(second.date || second.createdAt || 0) - new Date(first.date || first.createdAt || 0));
    const students = getRegisteredStudents().filter((student) => String(student.estado || "activo").toLowerCase() !== "retirado");

    if (viewAllRecords) {
        viewAllRecords.hidden = submissions.length <= 10;
    }

    if (!submissions.length) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; color:#6b7280; padding: 1rem;">No hay registros todavía.</td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = submissions.slice(0, 10).map((entry) => {
        const student = students.find((item) => {
            const fullName = `${item.nombre || ""} ${item.apellido || ""}`.trim().toLowerCase();
            return fullName === (entry.studentName || "").trim().toLowerCase();
        }) || {};

        const grado = student.grado || "—";
        const grupo = student.grupo || "—";
        const statusMap = {
            pendiente: { label: "Pendiente", className: "status-pending" },
            aprobada: { label: "Aprobado", className: "status-approved" },
            rechazada: { label: "Rechazado", className: "status-rejected" },
        };
        const status = statusMap[entry.status] || statusMap.pendiente;

        return `
            <tr>
                <td>${entry.studentName || "Sin nombre"}</td>
                <td>${grado}</td>
                <td>${grupo}</td>
                <td>${entry.literacyPlace || "—"}</td>
                <td>${Number(entry.hours || 0)}</td>
                <td><span class="badge ${status.className}">${status.label}</span></td>
                <td>${entry.date || "—"}</td>
                <td>
                    <button class="btn-edit" type="button" aria-label="Ver registro"></button>
                    <button class="btn-chat" type="button" aria-label="Comentar registro"></button>
                </td>
            </tr>
        `;
    }).join("");

    if (studentsStat) {
        const totalStudents = students.filter((student) => Number(student.grado) === 10 || Number(student.grado) === 11).length;
        studentsStat.textContent = totalStudents;
    }

}

function getStudentApprovedHours(studentName) {
    const studentKey = (studentName || "").trim().toLowerCase();
    if (!studentKey) {
        return 0;
    }

    function renderDashboardSummary() {
        const students = getRegisteredStudents().filter((student) =>
            String(student.estado || "activo").toLowerCase() !== "retirado"
        );
        const fullName = `${JSON.parse(localStorage.getItem("socialhours_user") || "null")?.nombre || ""} ${JSON.parse(localStorage.getItem("socialhours_user") || "null")?.apellido || ""}`.trim() || "Secretaria";
        const studentsWithHours = students.filter((student) =>
            getStudentApprovedHours(`${student.nombre || ""} ${student.apellido || ""}`.trim()) > 0
        );

        if (welcomeMessage) welcomeMessage.textContent = `Hola, ${fullName}. Aquí puedes consultar y organizar la información de las horas sociales.`;
        if (totalStudentsStat) totalStudentsStat.textContent = students.length;
        if (grade10Stat) grade10Stat.textContent = students.filter((student) => Number(student.grado) === 10).length;
        if (grade11Stat) grade11Stat.textContent = students.filter((student) => Number(student.grado) === 11).length;
        if (studentsWithHoursStat) studentsWithHoursStat.textContent = studentsWithHours.length;
    }

    return getSubmissions()
        .filter((entry) => (entry.status === "aprobada") && ((entry.studentName || "").trim().toLowerCase() === studentKey))
        .reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
}

function renderStudentRecordsTable(searchTerm = "") {
    if (!studentRecordsTableBody) {
        return;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const students = getRegisteredStudents().filter((student) => {
        const grado = Number(student.grado);
        const fullName = `${student.nombre || ""} ${student.apellido || ""}`;
        return (grado === 10 || grado === 11) &&
            String(student.estado || "activo").toLowerCase() !== "retirado" &&
            (matchesSearch(fullName, normalizedSearch) || matchesSearch(student.institucion, normalizedSearch));
    }).sort((first, second) => {
        return new Date(second.registradoEn || 0).getTime() - new Date(first.registradoEn || 0).getTime();
    }).slice(0, 5);

    if (!students.length) {
        studentRecordsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#6b7280; padding: 1rem;">No hay estudiantes registrados.</td>
            </tr>
        `;
        return;
    }

    studentRecordsTableBody.innerHTML = students.map((student) => {
        const nombre = student.nombre || "";
        const apellido = student.apellido || "";
        const grado = student.grado || "—";
        const grupo = student.grupo || "—";
        const approvedHours = getStudentApprovedHours(`${nombre} ${apellido}`);
        const totalHours = Math.min(approvedHours, REQUIRED_HOURS);
        return `
            <tr>
                <td>${nombre}</td>
                <td>${apellido}</td>
                <td>${grado}</td>
                <td>${grupo}</td>
                <td>${totalHours}</td>
            </tr>
        `;
    }).join("");
}

function renderStudentGroups(searchTerm = "") {
    if (!studentsGroupsContainer) {
        return;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const students = getRegisteredStudents().filter((student) => {
        const grado = Number(student.grado);
        const fullName = `${student.nombre || ""} ${student.apellido || ""}`;
        return (grado === 10 || grado === 11) &&
            String(student.estado || "activo").toLowerCase() !== "retirado" &&
            (matchesSearch(fullName, normalizedSearch) || matchesSearch(student.institucion, normalizedSearch));
    }).filter((student, index, list) => {
        const fullName = `${student.nombre || ""} ${student.apellido || ""}`.trim().toLowerCase();
        return list.findIndex((candidate) =>
            `${candidate.nombre || ""} ${candidate.apellido || ""}`.trim().toLowerCase() === fullName
        ) === index;
    });

    const grades = { 10: {}, 11: {} };

    students.forEach((student) => {
        const grado = Number(student.grado);
        const grupo = String(student.grupo || "1");
        if (!grades[grado]) {
            grades[grado] = {};
        }
        if (!grades[grado][grupo]) {
            grades[grado][grupo] = [];
        }
        grades[grado][grupo].push(student);
    });

    const gradeOrder = [10, 11];
    const groupOrder = ["1", "2", "3"];

    const html = gradeOrder.map((grado) => {
        const groups = groupOrder.map((grupo) => {
            const groupStudents = grades[grado]?.[grupo] || [];
            const studentItems = groupStudents.length
                ? groupStudents.map((student) => `<li>${student.nombre} ${student.apellido}</li>`).join("")
                : `<li class="empty-group">Sin estudiantes</li>`;

            return `
                <a class="group-card" href="./grupo_estudiantes.html?grado=${grado}&grupo=${encodeURIComponent(grupo)}">
                    <h4>Grado ${grado} - Grupo ${grupo}</h4>
                    <ul>${studentItems}</ul>
                </a>
            `;
        }).join("");

        return `
            <div class="grade-block">
                <h4 class="grade-title">Grado ${grado}</h4>
                <div class="group-grid">${groups}</div>
            </div>
        `;
    }).join("");

    studentsGroupsContainer.innerHTML = students.length ? html : `
        <div class="empty-state">Aún no hay estudiantes registrados para los grados 10 y 11.</div>
    `;

    if (studentsStat) {
        studentsStat.textContent = students.length;
    }

}

window.addEventListener('storage', (event) => {
    if (event.key === 'socialhours_logout') {
        try {
            localStorage.removeItem('socialhours_token');
            localStorage.removeItem('socialhours_user');
        } catch (e) {
            console.warn('Error clearing storage on logout event:', e);
        }
        if (!window.location.href.includes('inicio_sesion.html')) {
            window.location.href = '../login/inicio_sesion.html';
        }
    }

    if (event.key === STUDENTS_STORAGE_KEY || event.key === HOURS_STORAGE_KEY || event.key === LEGACY_HOURS_STORAGE_KEY || event.key === NOTIFICATIONS_STORAGE_KEY) {
        removeOrphanSubmissions();
        renderHistoryTable();
        renderStudentGroups();
        renderStudentRecordsTable();
        renderNotifications();
    }
});

window.addEventListener('hours-list-updated', renderNotifications);

document.querySelectorAll(".student-search").forEach((searchInput) => {
    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value;
        renderHistoryTable(searchTerm);
        renderStudentGroups(searchTerm);
        renderStudentRecordsTable(searchTerm);
    });
});

if (toggleHistory && historyContent) {
    toggleHistory.addEventListener("click", () => {
        const isExpanded = toggleHistory.getAttribute("aria-expanded") === "true";
        toggleHistory.setAttribute("aria-expanded", String(!isExpanded));
        toggleHistory.setAttribute("title", isExpanded ? "Mostrar registros" : "Ocultar registros");
        historyContent.hidden = isExpanded;
    });
}

if (token) {
    fetch(`${window.SOCIALHOURS_API_BASE}/auth/me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        credentials: "include",
    })
    .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "No autorizado");
        }

        const user = data.user;
        const nombreCompleto = `${user.nombre || "Secretaria"} ${user.apellido || ""}`.trim();

        if (userTitle) {
            userTitle.textContent = `Panel de Secretaria: ${nombreCompleto || "Secretaria"}`;
        }
    })
    .catch((error) => {
        console.error(error);
        localStorage.removeItem("socialhours_token");
        localStorage.removeItem("socialhours_user");
    });
}

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
    confirmBtn.addEventListener("click", async () => {
        modal.classList.remove("show");
        try {
            await fetch(`${window.SOCIALHOURS_API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
        } catch (e) {
            console.warn("Error calling logout endpoint:", e);
        }

        try {
            localStorage.removeItem("socialhours_token");
            localStorage.removeItem("socialhours_user");
            localStorage.setItem("socialhours_logout", Date.now().toString());
        } catch (e) {
            console.warn("Error clearing storage during logout:", e);
        }

        window.location.href = "../login/inicio_sesion.html";
    });
}
setupLogoutConfirmation();

const syncDashboardStudents = async () => {
    const token = localStorage.getItem("socialhours_token");
    if (!token) return;
    const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
    });
    if (!response.ok) throw new Error("No fue posible sincronizar los estudiantes");
    const data = await response.json();
    if (Array.isArray(data.students)) {
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(data.students.map((student) => ({
            ...student, dbId: student.id, id: student.id,
        }))));
    }
};

syncDashboardStudents().catch((error) => console.warn(error.message)).finally(() => {
renderHistoryTable();
renderStudentGroups();
renderStudentRecordsTable();
renderNotifications();
renderDashboardSummary();
});
