const token = localStorage.getItem("socialhours_token");
const userTitle = document.getElementById("userTitle");
const logoutBtn = document.getElementById("logoutBtn");
const studentsGroupsContainer = document.getElementById("studentsGroupsContainer");
const studentsStat = document.querySelector(".card.card-gray .stat-number");
const historyTableBody = document.getElementById("historyTableBody");
const viewAllRecords = document.getElementById("viewAllRecords");
const toggleHistory = document.getElementById("toggleHistory");
const historyContent = document.getElementById("historyContent");
const studentRecordsTableBody = document.getElementById("studentRecordsTableBody");
const transferStudentModal = document.getElementById("transferStudentModal");
const transferStudentDescription = document.getElementById("transferStudentDescription");
const transferGrade = document.getElementById("transferGrade");
const transferGroup = document.getElementById("transferGroup");
const confirmTransferButton = document.getElementById("confirmTransferButton");
const runMigrationButton = document.getElementById("runMigrationButton");
const STUDENTS_STORAGE_KEY = "socialhours_registered_students";
const HOURS_STORAGE_KEY = "socialhours_submissions";
const LEGACY_HOURS_STORAGE_KEY = "socialhours_registered_hours";
const NOTIFICATIONS_STORAGE_KEY = "socialhours_notifications";
const REQUIRED_HOURS = 80;

function matchesSearch(value, searchTerm) {
    return !searchTerm || String(value || "").toLowerCase().includes(searchTerm);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function buildStudentFullName(student) {
    return `${student?.nombre || ""} ${student?.apellido || ""}`.trim();
}

function openCertificate(student) {
    const fullName = buildStudentFullName(student) || "Estudiante";
    const grado = student?.grado || "—";
    const grupo = student?.grupo || "—";
    const institucion = student?.institucion || "Institución educativa";
    const horas = getStudentApprovedHours(fullName) || REQUIRED_HOURS;
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
                color: #3b82f6;
                font-weight: 700;
                font-size: 12px;
                text-align: center;
            }
            .title {
                text-align: center;
                font-size: 28px;
                font-weight: 700;
                margin: 10px 0 20px;
                color: #1f2937;
            }
            .text {
                font-size: 16px;
                line-height: 1.8;
                text-align: center;
                color: #374151;
            }
            .student-name {
                font-weight: 700;
                font-size: 28px;
                display: inline-block;
                margin: 8px 0;
                color: #1f2937;
            }
            .meta {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
                margin-top: 30px;
            }
            .meta-item {
                border: 1px solid #dfe5ef;
                border-radius: 12px;
                padding: 12px 14px;
                background: #f5f7fb;
            }
            .meta-label {
                display: block;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                color: #5f6b7a;
                text-transform: uppercase;
                margin-bottom: 6px;
            }
            .meta-value {
                font-size: 15px;
                color: #1f2937;
                font-weight: 600;
            }
            .footer {
                margin-top: 32px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                border-top: 2px solid #e6edf9;
                padding-top: 18px;
                font-size: 12px;
                color: #5f6b7a;
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
            @media print {
                body {
                    background: white;
                }
                .toolbar {
                    display: none !important;
                }
                .certificate {
                    box-shadow: none;
                    border: none;
                    margin: 0;
                    width: 100%;
                    max-width: 100%;
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

    const notificationsToggle = document.getElementById("notificationsToggle");
    const notificationsPanel = document.getElementById("notificationsPanel");
    if (notificationsToggle && notificationsPanel) {
        notificationsToggle.addEventListener("click", () => {
            const isOpen = notificationsToggle.getAttribute("aria-expanded") === "true";
            notificationsToggle.setAttribute("aria-expanded", String(!isOpen));
            notificationsPanel.hidden = isOpen;
        });
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

    async function syncStudentsFromDatabase() {
        const token = localStorage.getItem("socialhours_token");
        if (!token) return;
        try {
            const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            if (!response.ok) throw new Error("No fue posible sincronizar los estudiantes");
            const data = await response.json();
            if (Array.isArray(data.students)) {
                localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(data.students.map((student) => ({
                    ...student,
                    dbId: student.id,
                    id: student.id,
                    registradoEn: student.registradoEn || new Date().toISOString(),
                }))));
            }
        } catch (error) {
            console.warn("No se pudieron sincronizar los estudiantes:", error);
        }
    }
}

async function syncStudentsFromDatabaseGlobal() {
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
    const students = getRegisteredStudents();

    if (viewAllRecords) {
        viewAllRecords.hidden = submissions.length <= 10;
    }

    if (!submissions.length) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:#6b7280; padding: 1rem;">No hay registros todavía.</td>
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
            (matchesSearch(fullName, normalizedSearch) || matchesSearch(student.institucion, normalizedSearch));
    }).sort((first, second) => {
        return new Date(second.registradoEn || 0).getTime() - new Date(first.registradoEn || 0).getTime();
    }).slice(0, 5);

    if (!students.length) {
        studentRecordsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:#6b7280; padding: 1rem;">No hay estudiantes registrados.</td>
            </tr>
        `;
        return;
    }

    studentRecordsTableBody.innerHTML = students.map((student) => {
        const nombre = student.nombre || "";
        const apellido = student.apellido || "";
        const grado = student.grado || "—";
        const idType = student.idType || "—";
        const idNumber = student.idNumber || "—";
        const estado = String(student.estado || "activo").trim().toLowerCase();
        const estadoLabel = estado === "retirado" ? "Retirado" : "Activo";
        const fullName = buildStudentFullName(student);
        const approvedHours = getStudentApprovedHours(fullName);
        const totalHours = Math.min(approvedHours, REQUIRED_HOURS);
        return `
            <tr>
                <td>${escapeHtml(idType)} ${escapeHtml(idNumber)}</td>
                <td>
                    <button class="student-certificate-link" type="button" data-student-name="${escapeHtml(fullName)}">
                        ${escapeHtml(nombre || "Sin nombre")}
                    </button>
                </td>
                <td>${escapeHtml(apellido || "—")}</td>
                <td>${escapeHtml(grado)}</td>
                <td>${estadoLabel}</td>
                <td>${totalHours}</td>
                <td>
                    <button class="certificate-btn" type="button" data-student-name="${escapeHtml(fullName)}">
                        Imprimir certificado
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

let selectedTransferStudent = null;

function closeTransferModal() {
    if (transferStudentModal) {
        transferStudentModal.hidden = true;
    }
    selectedTransferStudent = null;
}

function openTransferModal(student) {
    if (!transferStudentModal || !student) {
        return;
    }
    selectedTransferStudent = student;
    transferStudentDescription.textContent = `Selecciona el grado y grupo al que trasladarás a ${buildStudentFullName(student)}.`;
    transferGrade.value = String(student.grado || "11");
    transferGroup.value = String(student.grupo || "1");
    transferStudentModal.hidden = false;
}

async function confirmStudentTransfer() {
    if (!selectedTransferStudent || !confirmTransferButton) {
        return;
    }
    const destinationGrade = transferGrade.value;
    const destinationGroup = transferGroup.value;
    const currentLocation = `${selectedTransferStudent.grado}°${selectedTransferStudent.grupo || ""}`;
    const destinationLocation = `${destinationGrade}°${destinationGroup}`;
    if (currentLocation === destinationLocation) {
        showToast("Selecciona un grado y grupo diferente al actual.", "error");
        return;
    }
    if (!window.confirm(`¿Confirmar traslado de ${buildStudentFullName(selectedTransferStudent)} a ${destinationLocation}?`)) {
        return;
    }

    confirmTransferButton.disabled = true;
    try {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/${selectedTransferStudent.id || selectedTransferStudent.dbId}/transfer`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("socialhours_token") || ""}`,
            },
            credentials: "include",
            body: JSON.stringify({ grado: destinationGrade, grupo: destinationGroup }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "No fue posible realizar el traslado");
        }
        await syncStudentsFromDatabaseGlobal();
        closeTransferModal();
        renderStudentGroups();
        renderStudentRecordsTable();
        showToast(`${data.message}: ${destinationLocation}.`, "success");
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        confirmTransferButton.disabled = false;
    }
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
                ? groupStudents.map((student) => `<li>${escapeHtml(`${student.nombre || ""} ${student.apellido || ""}`.trim())}</li>`).join("")
                : `<li class="empty-group">Sin estudiantes</li>`;

            return `
                <div class="group-card">
                    <a class="group-card-link" href="../grupo_estudiantes/grupo_estudiantes.html?grado=${grado}&grupo=${encodeURIComponent(grupo)}">
                        <h4>Grado ${grado} - Grupo ${grupo}</h4>
                    </a>
                    <ul>${studentItems}</ul>
                </div>
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
        syncStudentsFromDatabaseGlobal().catch((error) => console.warn("No se pudieron sincronizar los estudiantes:", error));
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

if (studentRecordsTableBody) {
    studentRecordsTableBody.addEventListener("click", (event) => {
        const certificateButton = event.target.closest(".certificate-btn");
        const nameButton = event.target.closest(".student-certificate-link");
        const clickedButton = certificateButton || nameButton;

        if (!clickedButton) {
            return;
        }

        const selectedName = (clickedButton.dataset.studentName || "").trim();
        const student = getRegisteredStudents().find((item) => {
            return buildStudentFullName(item).trim().toLowerCase() === selectedName.toLowerCase();
        });

        if (!student) {
            showToast("No se encontró la información del estudiante para generar el certificado.", "error");
            return;
        }

        openCertificate(student);
    });
}

document.querySelectorAll("[data-close-transfer]").forEach((button) => {
    button.addEventListener("click", closeTransferModal);
});
confirmTransferButton?.addEventListener("click", confirmStudentTransfer);

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

runMigrationButton?.addEventListener("click", async () => {
    if (!window.confirm("¿Ejecutar la migración? Los estudiantes de 11° pasarán a retirados.")) return;
    runMigrationButton.disabled = true;
    try {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/migrate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible ejecutar la migración");
        showToast(`${data.message}. Promovidos: ${data.promoted}. Retirados: ${data.retired}.`, "success");
        const studentsResponse = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const studentsData = await studentsResponse.json();
        if (!studentsResponse.ok) throw new Error(studentsData.error || "No fue posible actualizar los estudiantes");
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(studentsData.students || []));
        renderStudentGroups();
        renderStudentRecordsTable();
        renderHistoryTable();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        runMigrationButton.disabled = false;
    }
});

const migrationPreviewButton = document.getElementById("migrationPreviewButton");
const migrationPreviewModal = document.getElementById("migrationPreviewModal");
const migrationPreviewBody = document.getElementById("migrationPreviewBody");
const migrationOriginYear = document.getElementById("migrationOriginYear");
const migrationDestinationYear = document.getElementById("migrationDestinationYear");
const migrationGroups = document.getElementById("migrationGroups");
const migrationStudentSearch = document.getElementById("migrationStudentSearch");
const confirmMigrationButton = document.getElementById("confirmMigrationButton");
const loadMigrationHistoryButton = document.getElementById("loadMigrationHistoryButton");
const migrationHistoryBody = document.getElementById("migrationHistoryBody");
let migrationPreviewStudents = [];
let selectedMigrationGroup = "all";
const migrationDecisions = new Map();

function closeMigrationPreview() {
    if (migrationPreviewModal) migrationPreviewModal.hidden = true;
}

async function loadMigrationHistory() {
    if (!migrationHistoryBody) return;
    loadMigrationHistoryButton.disabled = true;
    try {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/migrate/history`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible cargar el historial");
        migrationHistoryBody.innerHTML = data.history?.length
            ? data.history.map((migration) => `
                <tr>
                    <td>${migration.anio_origen}</td>
                    <td>${migration.anio_destino}</td>
                    <td>${new Date(migration.ejecutado_en).toLocaleString("es-CO")}</td>
                    <td>${escapeHtml(`${migration.ejecutor?.nombre || ""} ${migration.ejecutor?.apellido || ""}`.trim() || "—")}</td>
                    <td>${migration.detalles?.length || 0}</td>
                    <td>${escapeHtml(migration.estado || "confirmada")}</td>
                </tr>
            `).join("")
            : '<tr><td colspan="6">No hay migraciones registradas.</td></tr>';
    } catch (error) {
        console.error(error);
        migrationHistoryBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    } finally {
        loadMigrationHistoryButton.disabled = false;
    }
}

function getMigrationGroupKey(student) {
    return `${student.grado}|${student.grupo || "Sin grupo"}`;
}

function renderMigrationGroups(students) {
    const groups = new Map();
    students.forEach((student) => {
        const key = getMigrationGroupKey(student);
        if (!groups.has(key)) groups.set(key, { key, grado: student.grado, grupo: student.grupo || "Sin grupo", count: 0 });
        groups.get(key).count += 1;
    });
    migrationGroups.innerHTML = [
        `<label class="migration-group-option ${selectedMigrationGroup === "all" ? "selected" : ""}">
            <input type="radio" name="migrationGroup" value="all" ${selectedMigrationGroup === "all" ? "checked" : ""}>
            <span>Todos los grupos</span><strong>${students.length}</strong>
        </label>`,
        ...[...groups.values()].sort((a, b) => Number(a.grado) - Number(b.grado) || a.grupo.localeCompare(b.grupo)).map((group) => `
            <label class="migration-group-option ${selectedMigrationGroup === group.key ? "selected" : ""}">
                <input type="radio" name="migrationGroup" value="${escapeHtml(group.key)}" ${selectedMigrationGroup === group.key ? "checked" : ""}>
                <span>${escapeHtml(group.grado)}° - Grupo ${escapeHtml(group.grupo)}</span><strong>${group.count}</strong>
            </label>
        `),
    ].join("");
    migrationGroups.querySelectorAll("input[name='migrationGroup']").forEach((input) => {
        input.addEventListener("change", () => {
            selectedMigrationGroup = input.value;
            migrationStudentSearch.value = "";
            renderMigrationGroups(migrationPreviewStudents);
            renderMigrationPreviewTable();
        });
    });
}

function renderMigrationPreviewTable() {
    const search = migrationStudentSearch.value.trim().toLowerCase();
    const students = migrationPreviewStudents.filter((student) => {
        const matchesGroup = selectedMigrationGroup === "all" || getMigrationGroupKey(student) === selectedMigrationGroup;
        const matchesSearch = !search || `${student.nombre} ${student.grado} ${student.grupo || ""}`.toLowerCase().includes(search);
        return matchesGroup && matchesSearch;
    });
    migrationPreviewBody.innerHTML = students.length
        ? students.map((student) => `
            <tr>
                <td>${escapeHtml(student.nombre)}</td>
                <td>${escapeHtml(student.grado)}°</td>
                <td>${escapeHtml(student.grupo || "—")}</td>
                <td>
                    <select data-migration-action="${student.id}" aria-label="Decisión para ${escapeHtml(student.nombre)}">
                        <option value="promover" ${migrationDecisions.get(student.id) === "promover" ? "selected" : ""}>Promover</option>
                        <option value="no_promover" ${migrationDecisions.get(student.id) === "no_promover" ? "selected" : ""}>No promover</option>
                    </select>
                </td>
                <td>
                    <button class="transfer-student-btn migration-transfer-btn" type="button" data-student-id="${student.id}">
                        Trasladar
                    </button>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="5">No hay estudiantes que coincidan con la búsqueda.</td></tr>';

    migrationPreviewBody.querySelectorAll("[data-migration-action]").forEach((select) => {
        select.addEventListener("change", () => {
            migrationDecisions.set(Number(select.dataset.migrationAction), select.value);
        });
    });
    migrationPreviewBody.querySelectorAll(".migration-transfer-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const student = migrationPreviewStudents.find((item) => Number(item.id) === Number(button.dataset.studentId));
            if (student) openTransferModal(student);
        });
    });
}

function renderMigrationPreview(students) {
    migrationPreviewStudents = students;
    migrationDecisions.clear();
    students.forEach((student) => {
        migrationDecisions.set(student.id, student.accionSugerida || "no_promover");
    });
    selectedMigrationGroup = "all";
    renderMigrationGroups(students);
    renderMigrationPreviewTable();
}

migrationStudentSearch?.addEventListener("input", renderMigrationPreviewTable);
loadMigrationHistoryButton?.addEventListener("click", loadMigrationHistory);

migrationPreviewButton?.addEventListener("click", async () => {
    migrationPreviewButton.disabled = true;
    try {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/migrate/preview`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible cargar la vista previa");
        const currentYear = new Date().getFullYear();
        migrationOriginYear.value = currentYear;
        migrationDestinationYear.value = currentYear + 1;
        renderMigrationPreview(data.students || []);
        migrationPreviewModal.hidden = false;
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        migrationPreviewButton.disabled = false;
    }
});

document.querySelectorAll("[data-close-migration]").forEach((element) => {
    element.addEventListener("click", closeMigrationPreview);
});

confirmMigrationButton?.addEventListener("click", async () => {
    confirmMigrationButton.disabled = true;
    try {
        const decisiones = migrationPreviewStudents.map((student) => ({
            estudianteId: student.id,
            accion: migrationDecisions.get(student.id),
        }));
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/migrate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}`,
            },
            credentials: "include",
            body: JSON.stringify({
                anioOrigen: migrationOriginYear.value,
                anioDestino: migrationDestinationYear.value,
                decisiones,
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible confirmar la migración");
        closeMigrationPreview();
        showToast(`${data.message}. Procesados: ${data.processed}.`, "success");
        const studentsResponse = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const studentsData = await studentsResponse.json();
        if (!studentsResponse.ok) throw new Error(studentsData.error || "No fue posible actualizar los estudiantes");
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(studentsData.students || []));
        renderStudentGroups();
        renderStudentRecordsTable();
        renderHistoryTable();
        loadMigrationHistory();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        confirmMigrationButton.disabled = false;
    }
});

renderHistoryTable();
renderStudentGroups();
renderStudentRecordsTable();
renderNotifications();
loadMigrationHistory();
