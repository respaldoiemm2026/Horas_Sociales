const HOURS_KEY = "socialhours_submissions";
const LEGACY_HOURS_KEY = "socialhours_registered_hours";
const STUDENTS_KEY = "socialhours_registered_students";

const form = document.getElementById("hoursForm");
const tableBody = document.getElementById("hoursTableBody");
const statusField = document.getElementById("studentStatus");
const gradeField = document.getElementById("studentGrade");
const groupField = document.getElementById("studentGroup");
const requiredFields = [
    "studentIdType",
    "studentId",
    "studentStatus",
    "studentFirstName",
    "studentLastName",
    "literacyPlace",
    "registerDate",
    "hoursCount",
];

function updateAcademicFieldsRequirement() {
    const isRetired = statusField?.value === "retirado";
    [gradeField, groupField].forEach((field) => {
        if (field) field.required = !isRetired;
    });
}

function clearMissingFields() {
    requiredFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        const label = document.querySelector(`label[data-field="${fieldId}"]`);
        if (field) field.removeAttribute("aria-invalid");
        if (label) label.classList.remove("missing-field");
    });
}

function validateRequiredFields() {
    clearMissingFields();
    const isRetired = document.getElementById("studentStatus")?.value === "retirado";
    const fieldsToValidate = isRetired
        ? requiredFields
        : [...requiredFields, "studentGrade", "studentGroup"];
    const missingFields = fieldsToValidate.filter((fieldId) => {
        const field = document.getElementById(fieldId);
        return !field || !field.value.trim() ||
            (fieldId === "hoursCount" && (!Number.isFinite(Number(field.value)) || Number(field.value) <= 0));
    });

    missingFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        const label = document.querySelector(`label[data-field="${fieldId}"]`);
        if (field) field.setAttribute("aria-invalid", "true");
        if (label) label.classList.add("missing-field");
    });

    if (missingFields.length) {
        showToast("Faltan datos por completar. Revisa los campos marcados con *.", "error");
        const firstMissing = document.getElementById(missingFields[0]);
        if (firstMissing) firstMissing.focus();
        return false;
    }
    return true;
}

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

function getHours() {
    const primary = readList(HOURS_KEY);
    const legacy = readList(LEGACY_HOURS_KEY);
    const merged = [...primary, ...legacy];
    return merged.filter((entry, index, entries) => {
        const key = entry.id || `${entry.studentName}-${entry.date}-${entry.hours}-${entry.createdAt || ""}`;
        return entries.findIndex((candidate) =>
            (candidate.id || `${candidate.studentName}-${candidate.date}-${candidate.hours}-${candidate.createdAt || ""}`) === key
        ) === index;
    });
}

function saveHours(hours) {
    localStorage.setItem(HOURS_KEY, JSON.stringify(hours));
    localStorage.setItem(LEGACY_HOURS_KEY, JSON.stringify(hours));
}

function studentFullName(entry) {
    return `${entry.firstName || ""} ${entry.lastName || ""}`.trim();
}

async function registerStudent(entry) {
    const students = readList(STUDENTS_KEY);
    const name = studentFullName(entry).toLowerCase();
    const existing = students.find((student) =>
        `${student.nombre || ""} ${student.apellido || ""}`.trim().toLowerCase() === name
    );

    if (existing) {
        showToast(`Usuario ya registrado en ${existing.grado}° - grupo ${existing.grupo}`, "error");
        return false;
    }

    const response = await fetch(`${window.SOCIALHOURS_API_BASE}/auth/students`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("socialhours_token") || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({
            idType: entry.idType,
            idNumber: entry.idNumber,
            nombre: entry.firstName,
            apellido: entry.lastName,
            grado: entry.grade,
            grupo: entry.group,
            lugar: entry.literacyPlace,
            status: entry.status,
        }),
    });
    const responseData = await response.json();
    if (!response.ok) {
        showToast(responseData.error || "No fue posible registrar el estudiante", "error");
        return false;
    }

    const newStudent = {
        id: responseData.user.id,
        dbId: responseData.user.id,
        idType: entry.idType,
        idNumber: entry.idNumber,
        nombre: entry.firstName,
        apellido: entry.lastName,
        grado: entry.grade,
        grupo: entry.group,
        institucion: entry.literacyPlace,
        estado: entry.status,
        registradoEn: new Date().toISOString(),
    };
    students.push(newStudent);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    const fullName = `${newStudent.nombre || ""} ${newStudent.apellido || ""}`.trim();
    const notificationMessage = `${fullName} ha sido registrado en el sistema`;
    try {
        const notifications = JSON.parse(localStorage.getItem("socialhours_notifications") || "[]");
        const safeNotifications = Array.isArray(notifications) ? notifications : [];
        safeNotifications.unshift({ id: `${Date.now()}-${Math.random()}`, text: notificationMessage, createdAt: new Date().toISOString() });
        localStorage.setItem("socialhours_notifications", JSON.stringify(safeNotifications.slice(0, 10)));
    } catch (error) {
        console.warn("No se pudo guardar la notificación del estudiante:", error);
    }
    return true;
}

function render(searchTerm = "") {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const hours = getHours().filter((entry) =>
        String(entry.studentName || "").toLowerCase().includes(normalizedSearch) ||
        String(entry.literacyPlace || "").toLowerCase().includes(normalizedSearch)
    );

    tableBody.innerHTML = hours.length ? hours.map((entry) => `
        <tr>
            <td>${entry.studentName}</td>
            <td>${entry.date}</td>
            <td>${entry.literacyPlace}</td>
            <td>${entry.hours}</td>
            <td><span class="badge status-approved">Registrada</span></td>
            <td><button class="btn-action delete" type="button" data-id="${entry.id}">Eliminar</button></td>
        </tr>
    `).join("") : `<tr><td colspan="6" style="text-align:center; padding:1rem;">No hay horas registradas.</td></tr>`;

    tableBody.querySelectorAll("[data-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const entryToRemove = getHours().find((entry) => entry.id === button.dataset.id);
            const remainingHours = getHours().filter((entry) => entry.id !== button.dataset.id);
            saveHours(remainingHours);
            render();
            window.dispatchEvent(new Event("hours-list-updated"));
        });
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateRequiredFields()) return;
    const submitButton = form.querySelector("button[type='submit']");
    window.setButtonBusy(submitButton, true, "Registrando...");
    try {
    const data = new FormData(form);
    const entry = {
        id: `hours-${Date.now()}`,
        idType: data.get("studentIdType").trim(),
        idNumber: data.get("studentId").trim(),
        firstName: data.get("studentFirstName").trim(),
        lastName: data.get("studentLastName").trim(),
        studentName: `${data.get("studentFirstName").trim()} ${data.get("studentLastName").trim()}`,
        grade: data.get("studentGrade")?.trim() || "",
        group: data.get("studentGroup")?.trim() || "",
        status: data.get("studentStatus").trim(),
        literacyPlace: data.get("literacyPlace").trim(),
        date: data.get("registerDate"),
        hours: Number(data.get("hoursCount")),
        approvalStatus: "aprobada",
        createdAt: new Date().toISOString(),
    };

    if (!await registerStudent(entry)) return;

    const hours = getHours();
    hours.push(entry);
    saveHours(hours);
    const registrationMessage = `Se registro ${entry.hours} horas a ${entry.studentName}`;
    try {
        const notifications = JSON.parse(localStorage.getItem("socialhours_notifications") || "[]");
        const safeNotifications = Array.isArray(notifications) ? notifications : [];
        safeNotifications.unshift({ id: `${Date.now()}-${Math.random()}`, text: registrationMessage, createdAt: new Date().toISOString() });
        localStorage.setItem("socialhours_notifications", JSON.stringify(safeNotifications.slice(0, 10)));
    } catch (error) {
        console.warn("No se pudo guardar la notificación de registro:", error);
    }
    form.reset();
    render();
    window.dispatchEvent(new Event("hours-list-updated"));
    showToast("Horas registradas y estudiante agregado correctamente.", "success");
    } catch (error) {
        console.error(error);
        showToast(error.message || "No fue posible completar el registro", "error");
    } finally {
        window.setButtonBusy(submitButton, false);
    }
});

statusField?.addEventListener("change", updateAcademicFieldsRequirement);
updateAcademicFieldsRequirement();

requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) field.addEventListener("input", () => {
        if (field.value.trim()) {
            field.removeAttribute("aria-invalid");
            const label = document.querySelector(`label[data-field="${fieldId}"]`);
            if (label) label.classList.remove("missing-field");
        }
    });
    if (field) field.addEventListener("change", () => {
        if (field.value.trim()) {
            field.removeAttribute("aria-invalid");
            const label = document.querySelector(`label[data-field="${fieldId}"]`);
            if (label) label.classList.remove("missing-field");
        }
    });
});

window.addEventListener("storage", () => {
    render();
    renderNotifications();
});
window.addEventListener("hours-list-updated", () => {
    render();
    renderNotifications();
});
document.querySelectorAll(".student-search").forEach((searchInput) => {
    searchInput.addEventListener("input", () => render(searchInput.value));
});
render();
renderNotifications();
