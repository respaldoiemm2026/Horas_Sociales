const token = localStorage.getItem("socialhours_token");
const STUDENTS_STORAGE_KEY = "socialhours_registered_students";
const TRASH_STORAGE_KEY = "socialhours_deleted_students";
const REQUIRED_HOURS = 80;
const DELETE_RETENTION_DAYS = 90;

function getActiveUserName() {
    const user = JSON.parse(localStorage.getItem("socialhours_user") || "null");
    return `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || user?.email || "Usuario";
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

function addNotification(text) {
    const notifications = getNotifications();
    notifications.unshift({ text, createdAt: new Date().toISOString() });
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 10)));
}

function renderNotifications() {
    const list = document.getElementById("notificationsList");
    if (!list) return;
    const notifications = getNotifications();
    list.innerHTML = notifications.length
        ? notifications.slice(0, 8).map((item) => `<li class="notification-item"><span class="notification-dot"></span><p>${escapeHtml(item.text || "Notificación")}</p></li>`).join("")
        : '<li class="notification-empty">No hay notificaciones.</li>';
}

const notificationsToggle = document.getElementById("notificationsToggle");
const notificationsPanel = document.getElementById("notificationsPanel");
if (notificationsToggle && notificationsPanel) {
    notificationsToggle.addEventListener("click", () => {
        const isOpen = notificationsToggle.getAttribute("aria-expanded") === "true";
        notificationsToggle.setAttribute("aria-expanded", String(!isOpen));
        notificationsPanel.hidden = isOpen;
    });
}
window.addEventListener("storage", (event) => {
    if (event.key === NOTIFICATIONS_STORAGE_KEY) renderNotifications();
    if (event.key === STUDENTS_STORAGE_KEY) {
        loadStudents();
        renderTable();
        renderTrash();
    }
});

const vicentesCount = document.getElementById("vicentesCount");
const egresadosCount = document.getElementById("egresadosCount");
const totalCount = document.getElementById("totalCount");
const sectionTitle = document.getElementById("sectionTitle");
const studentsTableBody = document.getElementById("studentsTableBody");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");
const exportBtn = document.getElementById("exportBtn");

let currentFilter = "vigentes";
let allStudents = [];
let activeDeleteStudent = null;
let activeDeleteTrashEntry = null;
let deleteCountdownInterval = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getStudentStatus(student) {
    const grado = student?.grado;
    const estado = student?.estado || "activo";
    
    if (estado === "retirado") return "Retirado";
    if (grado === "10" || grado === "11") return "Activo";
    return "Retirado";
}

function isStudentVigente(student) {
    return getStudentStatus(student) === "Activo";
}

async function loadStudents() {
    const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    allStudents = storedStudents ? JSON.parse(storedStudents) : [];

    const token = localStorage.getItem("socialhours_token");
    if (token) {
        try {
            const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            if (!response.ok) throw new Error("No fue posible sincronizar los estudiantes");
            const data = await response.json();
            allStudents = Array.isArray(data.students) ? data.students.map((student) => ({
                ...student,
                dbId: student.id,
                id: student.id,
                registradoEn: student.registradoEn || new Date().toISOString(),
            })) : [];
            localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(allStudents));
        } catch (error) {
            console.warn("No se pudieron sincronizar los estudiantes:", error);
        }
    }

    const uniqueStudents = {};
    allStudents.forEach(student => {
        const key = `${student.idNumber || ""}-${student.nombre || ""}-${student.apellido || ""}`;
        if (!uniqueStudents[key] || new Date(student.registradoEn) > new Date(uniqueStudents[key].registradoEn)) {
            uniqueStudents[key] = student;
        }
    });
    
    allStudents = Object.values(uniqueStudents);
    updateStats();
}

function updateStats() {
    const vigentes = allStudents.filter(isStudentVigente).length;
    const egresados = allStudents.length - vigentes;
    
    vicentesCount.textContent = vigentes;
    egresadosCount.textContent = egresados;
    totalCount.textContent = allStudents.length;
}

function getFilteredStudents() {
    switch (currentFilter) {
        case "vigentes":
            return allStudents.filter(isStudentVigente);
        case "egresados":
            return allStudents.filter(s => !isStudentVigente(s));
        case "todos":
            return allStudents;
        default:
            return [];
    }
}

function matchesSearch(student, searchTerm) {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
        String(student.nombre || "").toLowerCase().includes(term) ||
        String(student.apellido || "").toLowerCase().includes(term) ||
        String(student.idNumber || "").toLowerCase().includes(term) ||
        String(student.grado || "").includes(term)
    );
}

function openCertificate(student) {
    const fullName = `${student?.nombre || ""} ${student?.apellido || ""}`.trim() || "Estudiante";
    const grado = student?.grado || "—";
    const grupo = student?.grupo || "—";
    const institucion = student?.institucion || "Institución educativa";
    const horas = Number(student?.totalHours || student?.hours || REQUIRED_HOURS);
    const fecha = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const escudoUrl = new URL("../../assets/escudo-maria-montessori.png", window.location.href).href;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
        showToast("El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para continuar.", "error");
        return;
    }

    printWindow.document.write(`<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>Certificado de participación</title>
        <style>
            body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: #f3f6fb;
                color: #1f2937;
            }
            .toolbar {
                position: sticky;
                top: 0;
                z-index: 2;
                display: flex;
                justify-content: center;
                gap: 10px;
                padding: 14px;
                background: #1f2937;
            }
            .toolbar button {
                border: 0;
                border-radius: 6px;
                padding: 9px 18px;
                font-weight: 700;
                cursor: pointer;
            }
            .toolbar .print-button { background: #93c5fd; }
            [contenteditable="true"] {
                outline: 2px dashed #3b82f6;
                outline-offset: 4px;
            }
            .certificate {
                width: 95%;
                max-width: 820px;
                margin: 40px auto;
                background: #fff;
                border: 1px solid #dfe5ef;
                border-radius: 18px;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
                padding: 42px 48px;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
                border-bottom: 2px solid #e6edf9;
                padding-bottom: 18px;
            }
            .brand {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
            }
            .brand small {
                display: block;
                font-size: 12px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #5f6b7a;
            }
            .seal {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 3px solid #dfe7f4;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
            }
            .main-content {
                text-align: center;
                margin: 40px 0;
            }
            h1 {
                font-size: 32px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .subtitle {
                font-size: 14px;
                color: #6b7280;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                margin-bottom: 28px;
            }
            .student-name {
                font-size: 24px;
                font-weight: 700;
                color: #3b82f6;
                margin: 16px 0;
            }
            .details {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin: 24px 0;
                font-size: 13px;
            }
            .detail-item {
                text-align: center;
            }
            .detail-label {
                font-weight: 600;
                color: #6b7280;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .detail-value {
                font-size: 14px;
                color: #1f2937;
                font-weight: 600;
            }
            .message {
                color: #5f6b7a;
                font-size: 13px;
                line-height: 1.6;
                margin: 28px 0;
            }
            .footer {
                display: flex;
                justify-content: space-around;
                align-items: flex-end;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #e6edf9;
            }
            .institution-header { display: flex; justify-content: center; align-items: flex-start; gap: 20px; text-align: center; font-family: "Times New Roman", serif; font-size: 11px; font-weight: 700; }
            .institution-name { flex: 1; }
            .institution-header .seal { flex: 0 0 55px; width: 55px; height: 75px; object-fit: contain; }
            hr { border: 0; border-top: 1px solid #777; margin: 25px 0 48px; }
            .coordinator, .certifies { text-align: center; font-family: "Times New Roman", serif; font-size: 12px; line-height: 1.2; }
            .certifies { margin: 48px 0 40px; font-weight: 700; }
            .text { text-align: justify; font-family: "Times New Roman", serif; font-size: 13px; line-height: 1.2; }
            .hours, .date { font-family: "Times New Roman", serif; font-size: 13px; }
            .hours { margin-top: 20px; }
            .date { margin-top: 30px; }
            .signature { margin-top: 95px; width: 200px; border-top: 1px solid #777; padding-top: 4px; font-family: "Times New Roman", serif; font-size: 11px; }
            .signature {
                text-align: center;
                width: 150px;
            }
            .signature-line {
                border-top: 2px solid #1f2937;
                margin: 12px 0 4px 0;
            }
            .signature-name {
                font-size: 12px;
                font-weight: 600;
                color: #1f2937;
            }
            .date-line {
                text-align: center;
                font-size: 12px;
                color: #6b7280;
            }
            @media print {
                body {
                    background: white;
                }
                .toolbar {
                    display: none !important;
                }
                .certificate {
                    margin: 0;
                    box-shadow: none;
                    border: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="toolbar">
            <button type="button" id="editButton">Editar</button>
            <button type="button" class="print-button" id="printButton">Imprimir</button>
        </div>
        <div class="certificate">
            <div class="institution-header" data-editable>
                <div class="institution-name">REPUBLICA DE COLOMBIA MINISTERIO DE EDUCACIÓN NACIONAL<br>
                INSTITUCIÓN EDUCATIVA MARIA MONTESSORI<br>
                ADSCRITA A LA SECRETARIA DE EDUCACIÓN DE MEDELLÍN<br>
                NIT 811018519-1 - DANE: 105001003280</div>
                <img class="seal" src="${escudoUrl}" alt="Escudo institucional">
            </div>
            <hr>
            <div class="title" data-editable>CERTIFICADO INDIVIDUAL SOBRE CUMPLIMIENTO DEL SERVICIO<br>SOCIAL OBLIGATORIO</div>
            <div class="coordinator" data-editable><strong><em>EL COORDINADOR DEL SERVICIO SOCIAL DEL ESTUDIANTADO</em></strong><br>
            <em>Con base en la Resolución 4210 del 12 de septiembre de 1996</em></div>
            <div class="certifies" data-editable>CERTIFICA QUE:</div>
            <div class="text" data-editable>
                El Alumno(a) <strong>${escapeHtml(fullName)}</strong> con número de identificación <strong>${escapeHtml(student?.numero_documento || student?.idNumber || "X")}</strong>, Realizó Actividades sociales en mejoramiento a los alrededores de los espacios de la Institución Educativa: Como pintura en las paredes dentro y fuera de la Institución Educativa, intervención en zonas verdes, proyecto Educativo para jóvenes de 10° y 11°, en temas de convivencia, formulación de hojas de vida, postura y respiración, toma de decisiones.
            </div>
            <p class="hours" data-editable>Cumplió con <strong>${horas} HORAS</strong> de servicio social en el desarrollo del mismo.</p>
            <p class="date" data-editable>Dado en Medellín, a los ${new Date().getDate()} días del mes ${new Date().toLocaleDateString("es-ES", { month: "long" })} del ${new Date().getFullYear()}</p>
            <div class="signature" data-editable><strong>MIGUEL ANGEL VELASQUEZ OBANDO</strong><br>C.C. 70.851.459<br>Rector</div>
        </div>
    </body>
    </html>`);
    printWindow.document.close();
    printWindow.document.getElementById("editButton").addEventListener("click", () => {
        printWindow.document.querySelectorAll("[data-editable]").forEach((block) => {
            block.contentEditable = "true";
        });
        printWindow.document.getElementById("editButton").textContent = "Edición activa";
    });
    printWindow.document.getElementById("printButton").addEventListener("click", () => {
        printWindow.document.querySelector(".toolbar").style.display = "none";
        printWindow.focus();
        printWindow.print();
        printWindow.document.querySelector(".toolbar").style.display = "flex";
    });
}

function getTrashEntries() {
    try {
        const trash = JSON.parse(localStorage.getItem(TRASH_STORAGE_KEY) || "[]");
        return Array.isArray(trash) ? trash : [];
    } catch (error) {
        console.warn("No se pudieron cargar los registros de la papelera:", error);
        return [];
    }
}

function saveTrashEntries(entries) {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(entries));
}

function purgeExpiredTrash() {
    const now = Date.now();
    const entries = getTrashEntries();
    const remaining = entries.filter((entry) => Number(entry.deleteAt || 0) > now);
    if (remaining.length !== entries.length) {
        saveTrashEntries(remaining);
    }
}

function renderTrash() {
    purgeExpiredTrash();
    const trashSection = document.getElementById("trashSection");
    const trashList = document.getElementById("trashList");
    if (!trashSection || !trashList) return;

    const entries = getTrashEntries();
    if (!entries.length) {
        trashSection.hidden = true;
        trashList.innerHTML = "";
        return;
    }

    trashSection.hidden = false;
    trashList.innerHTML = entries.map((entry) => {
        const deleteAt = Number(entry.deleteAt || 0);
        const remainingMs = Math.max(deleteAt - Date.now(), 0);
        const remainingDays = Math.max(Math.ceil(remainingMs / (1000 * 60 * 60 * 24)), 0);
        return `
            <div class="trash-item">
                <div>
                    <strong>${escapeHtml(entry.studentName || "Estudiante")}</strong>
                    <small>Eliminado: ${escapeHtml(new Date(entry.deletedAt || Date.now()).toLocaleString("es-ES"))}</small>
                    <small>Por: ${escapeHtml(entry.deletedBy || "Usuario")}</small>
                </div>
                <div class="trash-actions">
                    <span class="trash-status">${remainingDays} días restantes</span>
                    <button type="button" class="restore-student-btn" data-restore-id="${escapeHtml(entry.id || "")}">Restaurar</button>
                    <button type="button" class="delete-trash-btn" data-delete-trash-id="${escapeHtml(entry.id || "")}">Eliminar definitivamente</button>
                </div>
            </div>
        `;
    }).join("");

    trashList.querySelectorAll(".restore-student-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const entryId = button.dataset.restoreId;
            const trashEntries = getTrashEntries();
            const targetEntry = trashEntries.find((entry) => String(entry.id) === String(entryId));
            if (!targetEntry) return;

            const restoredStudent = targetEntry.student || {
                nombre: targetEntry.studentName?.split(" ")[0] || "",
                apellido: targetEntry.studentName?.split(" ").slice(1).join(" ") || "",
                estado: "activo"
            };

            const students = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY) || "[]");
            const safeStudents = Array.isArray(students) ? students : [];
            safeStudents.push(restoredStudent);
            localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(safeStudents));

            saveTrashEntries(trashEntries.filter((entry) => String(entry.id) !== String(entryId)));
            allStudents = safeStudents;
            renderTable();
            updateStats();
            renderTrash();
            showToast("El estudiante fue restaurado y vuelve a aparecer en los listados activos.", "success");
        });
    });

    trashList.querySelectorAll(".delete-trash-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const entry = getTrashEntries().find((item) => String(item.id) === String(button.dataset.deleteTrashId));
            if (entry) openTrashDeleteModal(entry);
        });
    });
}

function clearDeleteCountdown() {
    if (deleteCountdownInterval) {
        clearInterval(deleteCountdownInterval);
        deleteCountdownInterval = null;
    }

    const confirmButton = document.getElementById("confirmDeleteStudentBtn");
    const countdownAlert = document.getElementById("deleteCountdownAlert");
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = "Confirmar eliminación (8s)";
    }
    if (countdownAlert) {
        countdownAlert.textContent = "Confirma la eliminación en 8 segundos para continuar.";
    }
}

function startDeleteCountdown() {
    const confirmButton = document.getElementById("confirmDeleteStudentBtn");
    const countdownAlert = document.getElementById("deleteCountdownAlert");
    if (!confirmButton || !countdownAlert) return;

    clearDeleteCountdown();

    let remainingSeconds = 8;
    confirmButton.disabled = true;
    confirmButton.textContent = `Confirmar eliminación (${remainingSeconds}s)`;
    countdownAlert.textContent = `Confirma la eliminación en ${remainingSeconds} segundos para continuar.`;

    deleteCountdownInterval = setInterval(() => {
        remainingSeconds -= 1;
        if (remainingSeconds <= 0) {
            clearInterval(deleteCountdownInterval);
            deleteCountdownInterval = null;
            confirmButton.disabled = false;
            confirmButton.textContent = "Aceptar eliminación";
            countdownAlert.textContent = "La cuenta regresiva terminó. Ya puede confirmar la eliminación.";
            return;
        }

        confirmButton.textContent = `Confirmar eliminación (${remainingSeconds}s)`;
        countdownAlert.textContent = `Confirma la eliminación en ${remainingSeconds} segundos para continuar.`;
    }, 1000);
}

function updateDeleteModalState() {
    const termsAccepted = document.getElementById("deleteTermsAccepted");
    const userIdentifier = document.getElementById("deleteUserIdentifier");
    const deletePassword = document.getElementById("deletePassword");
    if (!termsAccepted || !userIdentifier || !deletePassword) return;

    const readyToProceed = termsAccepted.checked && userIdentifier.value.trim() && deletePassword.value.trim();
    if (!readyToProceed) {
        clearDeleteCountdown();
        return;
    }

    if (!deleteCountdownInterval) {
        startDeleteCountdown();
    }
}

function closeDeleteModal() {
    const deleteModal = document.getElementById("deleteStudentModal");
    if (!deleteModal) return;
    deleteModal.classList.remove("is-open");
    deleteModal.setAttribute("aria-hidden", "true");
    clearDeleteCountdown();
    activeDeleteStudent = null;
    activeDeleteTrashEntry = null;
}

function openDeleteModal(student) {
    const deleteModal = document.getElementById("deleteStudentModal");
    const termsAccepted = document.getElementById("deleteTermsAccepted");
    const userIdentifier = document.getElementById("deleteUserIdentifier");
    const deletePassword = document.getElementById("deletePassword");
    const title = document.getElementById("deleteStudentTitle");
    const alertBox = document.querySelector("#deleteStudentModal .alert-box");
    const termsStep = document.getElementById("deleteTermsStep");
    const termsAcceptanceStep = document.getElementById("deleteTermsAcceptanceStep");
    const credentialsStep = document.getElementById("deleteCredentialsStep");
    const countdownStep = document.getElementById("deleteCountdownStep");
    const confirmButton = document.getElementById("confirmDeleteStudentBtn");
    if (!deleteModal || !termsAccepted || !userIdentifier || !deletePassword || !title || !confirmButton) return;

    activeDeleteStudent = student;
    activeDeleteTrashEntry = null;
    title.textContent = `Eliminar registro de ${student.nombre || ""} ${student.apellido || ""}`.trim() || "Eliminar registro";
    if (alertBox) {
        alertBox.innerHTML = "<strong>Alerta:</strong> Esta acción marcará al estudiante para eliminación y lo sacará del registro activo.";
    }
    if (termsStep) termsStep.hidden = false;
    if (termsAcceptanceStep) termsAcceptanceStep.hidden = false;
    if (credentialsStep) credentialsStep.hidden = false;
    if (countdownStep) countdownStep.hidden = false;
    termsAccepted.checked = false;
    userIdentifier.value = "";
    deletePassword.value = "";
    confirmButton.disabled = true;
    confirmButton.textContent = "Confirmar eliminación (8s)";

    deleteModal.classList.add("is-open");
    deleteModal.setAttribute("aria-hidden", "false");
}

function openTrashDeleteModal(entry) {
    const student = entry.student || {
        nombre: entry.studentName?.split(" ")[0] || "",
        apellido: entry.studentName?.split(" ").slice(1).join(" ") || "",
    };
    openDeleteModal(student);
    activeDeleteTrashEntry = entry;
    document.getElementById("deleteStudentTitle").textContent = `Eliminar definitivamente a ${entry.studentName || "este estudiante"}`;
    document.querySelector("#deleteStudentModal .alert-box").innerHTML =
        "<strong>Alerta:</strong> Esta acción eliminará permanentemente al estudiante y no se podrá restaurar.";
    document.getElementById("deleteTermsStep").hidden = true;
    document.getElementById("deleteTermsAcceptanceStep").hidden = true;
    document.getElementById("deleteCredentialsStep").hidden = true;
    document.getElementById("deleteCountdownStep").hidden = true;
    document.getElementById("confirmDeleteStudentBtn").disabled = false;
    document.getElementById("confirmDeleteStudentBtn").textContent = "Confirmar eliminación";
}

function finalizeStudentDeletion(student) {
    if (!student) return;

    const studentName = `${student.nombre || ""} ${student.apellido || ""}`.trim();
    const remainingStudents = allStudents.filter((candidate) => {
        const candidateName = `${candidate.nombre || ""} ${candidate.apellido || ""}`.trim();
        return candidateName.toLowerCase() !== studentName.toLowerCase() || (candidate.idNumber || "") !== (student.idNumber || "");
    });

    allStudents = remainingStudents;
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(allStudents));

    const trashEntries = getTrashEntries();
    trashEntries.unshift({
        id: student.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        studentName,
        deletedAt: new Date().toISOString(),
        deleteAt: Date.now() + (DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        deletedBy: getActiveUserName(),
        student,
    });
    saveTrashEntries(trashEntries);

    renderTable();
    updateStats();
    renderTrash();
    addNotification(`Se eliminó a ${studentName} de los estudiantes registrados`);
    closeDeleteModal();
    showToast("El registro del estudiante fue enviado a la papelera oculta. Será eliminado definitivamente en 3 meses.", "success");
}

async function finalizeTrashDeletion(entry) {
    const databaseId = Number(entry.student?.dbId || entry.student?.id);
    if (Number.isInteger(databaseId)) {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/${databaseId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token")}` },
            credentials: "include",
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            showToast(result.error || "No fue posible eliminar el estudiante de la base de datos.", "error");
            return;
        }
    }
    const remaining = getTrashEntries().filter((item) => String(item.id) !== String(entry.id));
    saveTrashEntries(remaining);
    const deletedName = String(entry.studentName || "").trim().toLowerCase();
    const removeStudentHours = (key) => {
        const hours = JSON.parse(localStorage.getItem(key) || "[]");
        const filtered = Array.isArray(hours)
            ? hours.filter((item) => String(item.studentName || "").trim().toLowerCase() !== deletedName)
            : [];
        localStorage.setItem(key, JSON.stringify(filtered));
    };
    removeStudentHours(HOURS_STORAGE_KEY);
    removeStudentHours(LEGACY_HOURS_STORAGE_KEY);
    closeDeleteModal();
    activeDeleteTrashEntry = null;
    activeDeleteStudent = null;
    renderTrash();
    addNotification(`Se eliminó permanentemente a ${entry.studentName || "un estudiante"}`);
    showToast("El estudiante fue eliminado definitivamente.", "success");
}

function renderTable() {
    const filtered = getFilteredStudents();
    const searched = filtered.filter(s => matchesSearch(s, searchInput.value));

    if (searched.length === 0) {
        studentsTableBody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">No hay estudiantes registrados en esta categoría</td>
            </tr>
        `;
        return;
    }

    studentsTableBody.innerHTML = searched.map(student => {
        const status = getStudentStatus(student);
        const statusClass = status === "Activo" ? "status-active" : "status-retired";
        const idDisplay = student.idType && student.idNumber 
            ? `${escapeHtml(student.idType)} ${escapeHtml(student.idNumber)}`
            : "—";
        const studentIdentifier = student.id || `${student.idNumber || ""}-${student.nombre || ""}-${student.apellido || ""}`;
        
        return `
            <tr>
                <td>${idDisplay}</td>
                <td>${escapeHtml(student.nombre || "—")}</td>
                <td>${escapeHtml(student.apellido || "—")}</td>
                <td>${escapeHtml(student.grado || "—")}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${formatDate(student.registradoEn)}</td>
                <td>
                    <button class="btn-certificate" type="button" data-action="certificate" data-student-id="${escapeHtml(studentIdentifier)}">
                        Certificado
                    </button>
                </td>
                <td>
                    <button class="delete-student-btn" type="button" data-action="delete" data-student-id="${escapeHtml(studentIdentifier)}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    studentsTableBody.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const studentId = button.dataset.studentId;
            const selectedStudent = allStudents.find((student) => {
                const candidateId = student.id || `${student.idNumber || ""}-${student.nombre || ""}-${student.apellido || ""}`;
                return String(candidateId) === String(studentId);
            });

            if (!selectedStudent) return;

            if (button.dataset.action === "certificate") {
                openCertificate(selectedStudent);
                return;
            }

            openDeleteModal(selectedStudent);
        });
    });
}

function updateSectionTitle() {
    const titles = {
        vigentes: "Estudiantes Vigentes",
        egresados: "Estudiantes Egresados/Retirados",
        todos: "Todos los Estudiantes"
    };
    sectionTitle.textContent = titles[currentFilter] || "Estudiantes";
}

document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        updateSectionTitle();
        renderTable();
    });
});

searchInput.addEventListener("input", renderTable);

exportBtn.addEventListener("click", () => {
    const filtered = getFilteredStudents();
    let csv = "ID,Nombre,Apellido,Grado,Estado,Fecha Registro\n";
    
    filtered.forEach(student => {
        const status = getStudentStatus(student);
        const idDisplay = student.idType && student.idNumber 
            ? `${student.idType} ${student.idNumber}`
            : "—";
        csv += `"${idDisplay}","${student.nombre || ""}","${student.apellido || ""}","${student.grado || ""}","${status}","${formatDate(student.registradoEn)}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudiantes_${currentFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

document.querySelectorAll(".student-search").forEach(input => {
    input.addEventListener("input", (e) => {
        searchInput.value = e.target.value;
        renderTable();
    });
});

const deleteModal = document.getElementById("deleteStudentModal");
if (deleteModal) {
    deleteModal.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
            closeDeleteModal();
        }
    });
}

const deleteTermsAccepted = document.getElementById("deleteTermsAccepted");
if (deleteTermsAccepted) {
    deleteTermsAccepted.addEventListener("change", updateDeleteModalState);
}

const deleteUserIdentifier = document.getElementById("deleteUserIdentifier");
const deletePassword = document.getElementById("deletePassword");
[deleteUserIdentifier, deletePassword].forEach((field) => {
    if (field) field.addEventListener("input", updateDeleteModalState);
});

const confirmDeleteStudentBtn = document.getElementById("confirmDeleteStudentBtn");
if (confirmDeleteStudentBtn) {
    confirmDeleteStudentBtn.addEventListener("click", async () => {
        if (confirmDeleteStudentBtn.disabled || !activeDeleteStudent) return;

        if (activeDeleteTrashEntry) {
            await finalizeTrashDeletion(activeDeleteTrashEntry);
            return;
        }

        const termsAccepted = document.getElementById("deleteTermsAccepted");
        const userIdentifier = document.getElementById("deleteUserIdentifier");
        const passwordInput = document.getElementById("deletePassword");

        if (!termsAccepted || !userIdentifier || !passwordInput) return;
        if (!termsAccepted.checked || !userIdentifier.value.trim() || !passwordInput.value.trim()) {
            showToast("Debes aceptar los TyC y completar correo/usuario y contraseña.", "error");
            return;
        }
        const activeUser = JSON.parse(localStorage.getItem("socialhours_user") || "null");
        const activeEmail = String(activeUser?.email || "").toLowerCase();
        const enteredEmail = userIdentifier.value.trim().toLowerCase();
        const idRole = Number(activeUser?.id_rol ?? activeUser?.rol ?? 0);
        let validCredentials = enteredEmail === activeEmail && Boolean(activeEmail) && Boolean(idRole);
        if (validCredentials) {
            const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: activeEmail, password: passwordInput.value.trim(), id_rol: idRole }),
            });
            validCredentials = response.ok;
        }
        if (!validCredentials) {
            showToast("El correo y la contraseña deben pertenecer al usuario activo.", "error");
            return;
        }

        finalizeStudentDeletion(activeDeleteStudent);
    });
}

loadStudents().then(() => {
    removeOrphanSubmissions();
    renderTable();
    updateSectionTitle();
    renderTrash();
    renderNotifications();
}).catch((error) => console.warn("No se pudieron cargar los estudiantes:", error));
