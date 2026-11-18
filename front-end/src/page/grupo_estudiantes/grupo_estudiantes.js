const STUDENTS_KEY = "socialhours_registered_students";
const HOURS_KEY = "socialhours_submissions";
const LEGACY_HOURS_KEY = "socialhours_registered_hours";
const REQUIRED_HOURS = 80;

const params = new URLSearchParams(window.location.search);
const grade = params.get("grado");
const group = params.get("grupo");
const title = document.getElementById("groupTitle");
const tableBody = document.getElementById("groupStudentsBody");
const printHoursRosterButton = document.getElementById("printHoursRosterButton");
const transferStudentModal = document.getElementById("transferStudentModal");
const transferStudentDescription = document.getElementById("transferStudentDescription");
const transferGrade = document.getElementById("transferGrade");
const transferGroup = document.getElementById("transferGroup");
const confirmTransferButton = document.getElementById("confirmTransferButton");
let selectedTransferStudent = null;

function readList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error(`No se pudo leer ${key}:`, error);
        return [];
    }
}

function getHours() {
    const entries = [...readList(HOURS_KEY), ...readList(LEGACY_HOURS_KEY)];
    return entries.filter((entry, index, list) => {
        const key = entry.id || `${entry.studentName}-${entry.date}-${entry.hours}`;
        return list.findIndex((candidate) =>
            (candidate.id || `${candidate.studentName}-${candidate.date}-${candidate.hours}`) === key
        ) === index;
    });
}

function getApprovedHours(studentName) {
    const key = studentName.trim().toLowerCase();
    return getHours()
        .filter((entry) => entry.status === "aprobada" && (entry.studentName || "").trim().toLowerCase() === key)
        .reduce((total, entry) => total + Number(entry.hours || 0), 0);
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

function openCertificate(student) {
    const fullName = `${student.nombre || ""} ${student.apellido || ""}`.trim() || "Estudiante";
    const grado = student?.grado || "—";
    const grupo = student?.grupo || "—";
    const institucion = student?.institucion || "Institución educativa";
    const horas = getApprovedHours(fullName) || REQUIRED_HOURS;
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
                El Alumno(a) <strong>${escapeHtml(fullName)}</strong> con número de identificación <strong>${escapeHtml(student?.idNumber || "X")}</strong>, Realizó Actividades sociales en mejoramiento a los alrededores de los espacios de la Institución Educativa: Como pintura en las paredes dentro y fuera de la Institución Educativa, intervención en zonas verdes, proyecto Educativo para jóvenes de 10° y 11°, en temas de convivencia, formulación de hojas de vida, postura y respiración, toma de decisiones.
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

function render() {
    const students = readList(STUDENTS_KEY).filter((student) =>
        Number(student.grado) === Number(grade) &&
        String(student.grupo || "1") === String(group) &&
        String(student.estado || "activo").toLowerCase() !== "retirado"
    );

    title.textContent = `Estudiantes de ${grade}° - Grupo ${group}`;
    tableBody.innerHTML = students.length ? students.map((student) => {
        const name = `${student.nombre || ""} ${student.apellido || ""}`.trim();
        const approvedHours = getApprovedHours(name);
        const totalHours = Math.min(approvedHours, REQUIRED_HOURS);
        const idType = student.idType || "—";
        const idNumber = student.idNumber || "—";

        return `
            <tr>
                <td>${idType} ${idNumber}</td>
                <td>${student.nombre || ""}</td>
                <td>${student.apellido || ""}</td>
                <td>${totalHours}</td>
                <td>
                    <button class="btn-action certificate-btn" type="button" data-student-id="${student.id}">Imprimir certificado</button>
                </td>
                <td class="student-actions">
                    <button class="btn-action transfer-student-btn" type="button" data-student-id="${student.id}">Trasladar</button>
                    <button class="btn-action delete-student" type="button" data-id="${student.id}">Eliminar</button>
                </td>
            </tr>
        `;
    }).join("") : `<tr><td colspan="6" style="text-align:center; padding:1rem;">No hay estudiantes en este grupo.</td></tr>`;

    tableBody.querySelectorAll(".certificate-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const student = readList(STUDENTS_KEY).find((entry) => String(entry.id) === button.dataset.studentId);
            if (student) {
                openCertificate(student);
            }

        });
    });

    tableBody.querySelectorAll(".delete-student").forEach((button) => {
        button.addEventListener("click", () => {
            const student = readList(STUDENTS_KEY).find((entry) => String(entry.id) === button.dataset.id);
            if (!student || !confirm(`¿Eliminar a ${student.nombre || ""} ${student.apellido || ""} del grupo?`)) return;

            const studentName = `${student.nombre || ""} ${student.apellido || ""}`.trim().toLowerCase();
            const studentFullName = `${student.nombre || ""} ${student.apellido || ""}`.trim();
            localStorage.setItem(STUDENTS_KEY, JSON.stringify(
                readList(STUDENTS_KEY).filter((entry) => String(entry.id) !== button.dataset.id)
            ));
            const remainingHours = getHours().filter((entry) =>
                (entry.studentName || "").trim().toLowerCase() !== studentName
            );
            localStorage.setItem(HOURS_KEY, JSON.stringify(remainingHours));
            localStorage.setItem(LEGACY_HOURS_KEY, JSON.stringify(remainingHours));
            try {
                const notifications = JSON.parse(localStorage.getItem("socialhours_notifications") || "[]");
                const safeNotifications = Array.isArray(notifications) ? notifications : [];
                safeNotifications.unshift({ id: `${Date.now()}-${Math.random()}`, text: `${studentFullName} ha sido eliminado del sistema`, createdAt: new Date().toISOString() });
                localStorage.setItem("socialhours_notifications", JSON.stringify(safeNotifications.slice(0, 10)));
            } catch (error) {
                console.warn("No se pudo guardar la notificación de estudiante eliminado:", error);
            }
            render();
        });
    });
}

function closeTransferModal() {
    if (transferStudentModal) transferStudentModal.hidden = true;
    selectedTransferStudent = null;
}

function openTransferModal(student) {
    selectedTransferStudent = student;
    transferStudentDescription.textContent = `Elige el nuevo grupo para ${student.nombre || ""} ${student.apellido || ""}.`;
    transferGrade.value = String(student.grado || grade);
    transferGroup.value = String(student.grupo || group);
    transferStudentModal.hidden = false;
}

async function confirmStudentTransfer() {
    if (!selectedTransferStudent) return;
    const destinationGrade = transferGrade.value;
    const destinationGroup = transferGroup.value;
    if (String(destinationGrade) === String(selectedTransferStudent.grado) &&
        String(destinationGroup) === String(selectedTransferStudent.grupo)) {
        showToast("Selecciona un grupo diferente al actual.", "error");
        return;
    }
    if (!window.confirm(`¿Trasladar a ${selectedTransferStudent.nombre || ""} ${selectedTransferStudent.apellido || ""} a ${destinationGrade}° - Grupo ${destinationGroup}?`)) return;

    confirmTransferButton.disabled = true;
    try {
        const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students/${selectedTransferStudent.id}/transfer`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}`,
            },
            credentials: "include",
            body: JSON.stringify({ grado: destinationGrade, grupo: destinationGroup }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible realizar el traslado");
        const studentsResponse = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}` },
            credentials: "include",
        });
        const studentsData = await studentsResponse.json();
        if (!studentsResponse.ok) throw new Error(studentsData.error || "No fue posible actualizar la lista");
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(studentsData.students || []));
        closeTransferModal();
        render();
        showToast(`${data.message}.`, "success");
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    } finally {
        confirmTransferButton.disabled = false;
    }
}

function printHoursRoster() {
    const students = readList(STUDENTS_KEY).filter((student) =>
        Number(student.grado) === Number(grade) &&
        String(student.grupo || "1") === String(group) &&
        String(student.estado || "activo").toLowerCase() !== "retirado" &&
        getApprovedHours(`${student.nombre || ""} ${student.apellido || ""}`.trim()) > 0
    );
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
        showToast("El navegador bloqueó la ventana de impresión.", "error");
        return;
    }
    const rows = students.map((student, index) => {
        const name = `${student.nombre || ""} ${student.apellido || ""}`.trim();
        return `<tr><td>${index + 1}</td><td>${escapeHtml(name)}</td><td>${escapeHtml(student.idNumber || "—")}</td><td>${getApprovedHours(name)}</td></tr>`;
    }).join("");
    printWindow.document.write(`
        <!doctype html><html lang="es"><head><meta charset="utf-8"><title>Listado de horas</title>
        <style>body{font-family:Arial,sans-serif;padding:32px;color:#1f2937}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #d1d5db;padding:10px;text-align:left}th{background:#e5edf8}@media print{button{display:none}}</style>
        </head><body><button onclick="window.print()">Imprimir</button><h1>Estudiantes con horas registradas</h1>
        <p>Grado ${escapeHtml(grade)}° - Grupo ${escapeHtml(group)}</p>
        <table><thead><tr><th>#</th><th>Estudiante</th><th>Identificación</th><th>Horas</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No hay estudiantes con horas registradas.</td></tr>'}</tbody></table>
        </body></html>
    `);
    printWindow.document.close();
}

printHoursRosterButton?.addEventListener("click", printHoursRoster);

tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest(".transfer-student-btn");
    if (!button) return;
    const student = readList(STUDENTS_KEY).find((entry) => String(entry.id) === button.dataset.studentId);
    if (student) openTransferModal(student);
});

document.querySelectorAll("[data-close-transfer]").forEach((button) => {
    button.addEventListener("click", closeTransferModal);
});
confirmTransferButton?.addEventListener("click", confirmStudentTransfer);

window.addEventListener("storage", (event) => {
    if (event.key === STUDENTS_KEY || event.key === HOURS_KEY || event.key === LEGACY_HOURS_KEY) {
        render();
    }
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
