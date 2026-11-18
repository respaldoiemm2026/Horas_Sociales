import bcrypt from "bcryptjs";
import { createUser, readUserByEmail, readUserByDocument, readUserByLoginIdentifier, findUserById, updateUser } from "../repository/usuarios.repository.js";
import Prisma from "../prisma.js";
import { generatetoken } from "../utils/jwt.js";

const roleNames = {
    1: "administrador",
    2: "estudiante",
    3: "profesor",
};

const allowedStudentStates = new Set(["activo", "retirado", "egresado", "trasladado", "no_promovido"]);

const normalizeText = (value) => String(value || "").trim();

const normalizeStudentStatus = (value) => {
    const status = normalizeText(value).toLowerCase();
    if (!allowedStudentStates.has(status)) {
        throw new Error("El estado del estudiante no es válido");
    }
    return status;
};

const ensureRoleExists = async (roleId) => {
    const normalizedRoleId = Number(roleId);
    if (!Number.isInteger(normalizedRoleId) || normalizedRoleId <= 0) {
        return null;
    }

    const existingRole = await Prisma.rol.findUnique({ where: { id: normalizedRoleId } });
    if (existingRole) {
        return existingRole;
    }

    const roleName = roleNames[normalizedRoleId] || `rol_${normalizedRoleId}`;
    return Prisma.rol.create({ data: { id: normalizedRoleId, rol: roleName } });
};

export const registerUser = async (user) => {
    const {
        email,
        password,
        nombre = "Usuario",
        apellido = "Sistema",
        id_curso = null,
        id_tipo_documento = 1,
        numero_documento,
        id_rol = 1,
        estado = "activo",
        anio_escolar = null,
    } = user;

    const normalizedEmail = normalizeText(email).toLowerCase();
    if (!normalizedEmail || !password) {
        throw new Error("Email and password are required");
    }

    const existingUser = await readUserByEmail(normalizedEmail);
    if (existingUser) {
        throw new Error("Ya existe un usuario con ese correo");
    }

    if (numero_documento) {
        const existingDocument = await readUserByDocument(String(numero_documento).trim());
        if (existingDocument) {
            throw new Error("Ya existe un usuario con ese ID");
        }
    }

    const roleId = Number(id_rol);
    const normalizedStatus = normalizeStudentStatus(estado);
    if (roleId === 2 && !anio_escolar) {
        throw new Error("El estudiante debe tener un año escolar");
    }
    if (roleId === 2 && normalizedStatus === "activo" && !id_curso) {
        throw new Error("El estudiante activo debe tener un curso");
    }
    await ensureRoleExists(roleId);

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await createUser({
        nombre: normalizeText(nombre),
        apellido: normalizeText(apellido),
        email: normalizedEmail,
        contraseña: hashedPassword,
        id_curso: id_curso ? Number(id_curso) : null,
        id_tipo_documento: Number(id_tipo_documento),
        numero_documento: normalizeText(numero_documento) || String(Date.now()),
        id_rol: roleId,
        estado: normalizedStatus,
        anio_escolar: anio_escolar ? Number(anio_escolar) : null,
    });

    return createdUser;
};

export const loginUser = async (user) => {
    const { email, password, id_rol } = user;
    const identifier = String(email || "").trim();
    const normalizedIdentifier = identifier.toLowerCase();

    if (!identifier || typeof password !== "string" || !password) {
        throw new Error("Las credenciales son inválidas");
    }

    const existingUser = await readUserByLoginIdentifier(normalizedIdentifier);
    const isPasswordValid = existingUser
        ? await bcrypt.compare(password, existingUser.contraseña)
        : false;

    if (!existingUser || !isPasswordValid || existingUser.estado !== "activo") {
        throw new Error("Las credenciales son inválidas");
    }

    if (id_rol !== undefined && Number(id_rol) !== existingUser.id_rol) {
        throw new Error("El rol seleccionado no corresponde a esta cuenta");
    }

    const token = generatetoken(existingUser);
    return { token, user: existingUser };
};

export const changePassword = async (userId, passwords) => {
    const { currentPassword, currentPasswordConfirmation, newPassword, newPasswordConfirmation } = passwords;
    if (!currentPassword || !currentPasswordConfirmation || !newPassword || !newPasswordConfirmation) {
        throw new Error("Todos los campos de contraseña son obligatorios");
    }
    if (currentPassword !== currentPasswordConfirmation) {
        throw new Error("La contraseña actual no coincide");
    }
    if (newPassword !== newPasswordConfirmation) {
        throw new Error("La nueva contraseña no coincide");
    }
    if (currentPassword === newPassword) {
        throw new Error("La nueva contraseña debe ser diferente");
    }

    const existingUser = await findUserById(Number(userId));
    if (!existingUser) {
        throw new Error("El usuario no existe");
    }
    if (!await bcrypt.compare(currentPassword, existingUser.contraseña)) {
        throw new Error("La contraseña actual es incorrecta");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return updateUser(Number(userId), { contraseña: hashedPassword });
};

export const registerUserByAdmin = async ({ nombre, apellido, numero_documento, email, id_rol }) => {
    if (!nombre || !apellido || !numero_documento || !email || ![1, 3].includes(Number(id_rol))) {
        throw new Error("Nombre, apellido, ID, correo y un rol válido son obligatorios");
    }

    return registerUser({
        nombre,
        apellido,
        numero_documento: String(numero_documento).trim(),
        email: String(email).trim().toLowerCase(),
        id_rol: Number(id_rol),
        password: String(numero_documento).trim(),
        id_tipo_documento: 1,
        id_curso: null,
    });
};

export const registerStudent = async ({ idType, idNumber, nombre, apellido, grado, grupo, lugar, status }) => {
    const normalizedStatus = String(status || "").trim().toLowerCase();
    const isRetired = normalizedStatus === "retirado";
    if (!idType || !idNumber || !nombre || !apellido || !lugar || !normalizedStatus || (!isRetired && (!grado || !grupo))) {
        throw new Error(isRetired
            ? "Tipo de identificación, número, nombre, apellido y lugar son obligatorios"
            : "Tipo de identificación, número, nombre, apellido, grado, grupo y lugar son obligatorios");
    }
    const documentNumber = String(idNumber).trim();
    if (await readUserByDocument(documentNumber)) {
        throw new Error("Ya existe un estudiante con ese número de identificación");
    }

    const documentType = await Prisma.tipo_documento.findFirst({ where: { nombre: String(idType).trim() } })
        || await Prisma.tipo_documento.create({ data: { nombre: String(idType).trim() } });
    let course = null;
    if (!isRetired) {
        const grade = await Prisma.grado.findFirst({ where: { grado: String(grado).trim() } })
            || await Prisma.grado.create({ data: { grado: String(grado).trim() } });
        const groupName = String(grupo).trim();
        const jornada = await Prisma.jornada.findFirst({ where: { jornada: groupName } })
            || await Prisma.jornada.create({ data: { jornada: groupName } });
        course = await Prisma.curso.findFirst({ where: { id_grado: grade.id, id_jornada: jornada.id } })
            || await Prisma.curso.create({ data: { id_grado: grade.id, id_jornada: jornada.id } });
    }
    const place = await Prisma.lugar.findFirst({ where: { nombre: String(lugar).trim() } })
        || await Prisma.lugar.create({ data: { nombre: String(lugar).trim() } });

    const user = await registerUser({
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        email: `${documentNumber}@student.socialhours.local`,
        password: documentNumber,
        id_curso: course?.id || null,
        id_tipo_documento: documentType.id,
        numero_documento: documentNumber,
        id_rol: 2,
        estado: isRetired ? "retirado" : "activo",
        anio_escolar: new Date().getFullYear(),
    });
    return updateUser(user.id, { id_lugar: place.id });
};

export const listStudents = async ({ page = 1, limit = 100, search = "", estado = "", grado = "", grupo = "" } = {}) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const normalizedSearch = normalizeText(search).toLowerCase();
    const filters = [
        { id_rol: 2 },
        estado ? { estado: normalizeStudentStatus(estado) } : {},
        grado ? { curso: { is: { grado: { grado: normalizeText(grado) } } } } : {},
        grupo ? { curso: { is: { jornada: { jornada: normalizeText(grupo) } } } } : {},
        normalizedSearch ? {
            OR: [
                { nombre: { contains: normalizedSearch, mode: "insensitive" } },
                { apellido: { contains: normalizedSearch, mode: "insensitive" } },
                { numero_documento: { contains: normalizedSearch, mode: "insensitive" } },
            ],
        } : {},
    ];
    const students = await Prisma.usuarios.findMany({
        where: { AND: filters },
        include: {
            tipo_documento: true,
            curso: { include: { grado: true, jornada: true } },
            lugar: true,
        },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
    });

    return students.map(({ contraseña, tipo_documento, curso, lugar, ...student }) => ({
        ...student,
        idType: tipo_documento?.nombre || "",
        idNumber: student.numero_documento,
        grado: curso?.grado?.grado || "",
        grupo: curso?.jornada?.jornada || "",
        institucion: lugar?.nombre || "",
        estado: student.estado || "activo",
    }));
};

export const transferStudent = async ({ studentId, grado, grupo }) => {
    const normalizedStudentId = Number(studentId);
    const targetGrade = normalizeText(grado);
    const targetGroup = normalizeText(grupo);

    if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
        throw new Error("Identificador de estudiante inválido");
    }
    if (!["10", "11"].includes(targetGrade) || !["1", "2", "3"].includes(targetGroup)) {
        throw new Error("El grado y grupo de destino no son válidos");
    }

    const student = await Prisma.usuarios.findFirst({
        where: { id: normalizedStudentId, id_rol: 2 },
        include: { curso: { include: { grado: true, jornada: true } } },
    });
    if (!student) {
        throw new Error("Estudiante no encontrado");
    }
    if (student.estado !== "activo") {
        throw new Error("Solo se pueden trasladar estudiantes activos");
    }

    const currentGrade = student.curso?.grado?.grado || "";
    const currentGroup = student.curso?.jornada?.jornada || "";
    if (currentGrade === targetGrade && currentGroup === targetGroup) {
        throw new Error("El estudiante ya pertenece a ese grado y grupo");
    }

    const targetGradeRecord = await Prisma.grado.findFirst({ where: { grado: targetGrade } })
        || await Prisma.grado.create({ data: { grado: targetGrade } });
    const targetGroupRecord = await Prisma.jornada.findFirst({ where: { jornada: targetGroup } })
        || await Prisma.jornada.create({ data: { jornada: targetGroup } });
    const targetCourse = await Prisma.curso.findFirst({
        where: {
            id_grado: targetGradeRecord.id,
            id_jornada: targetGroupRecord.id,
        },
    }) || await Prisma.curso.create({
        data: {
            id_grado: targetGradeRecord.id,
            id_jornada: targetGroupRecord.id,
        },
    });

    const updatedStudent = await Prisma.usuarios.update({
        where: { id: normalizedStudentId },
        data: { id_curso: targetCourse.id },
        include: { curso: { include: { grado: true, jornada: true } } },
    });

    return {
        id: updatedStudent.id,
        nombre: updatedStudent.nombre,
        apellido: updatedStudent.apellido,
        grado: updatedStudent.curso?.grado?.grado || targetGrade,
        grupo: updatedStudent.curso?.jornada?.jornada || targetGroup,
        estado: updatedStudent.estado,
        gradoAnterior: currentGrade,
        grupoAnterior: currentGroup,
    };
};

const migrationActions = new Set(["promover", "no_promover"]);

const getMigrationStudents = async () => {
    const grade10 = await Prisma.grado.findFirst({ where: { grado: "10" } });
    const grade11 = await Prisma.grado.findFirst({ where: { grado: "11" } });
    if (!grade10 || !grade11) {
        throw new Error("No existen los grados 10 y 11 configurados");
    }

    const students = await Prisma.usuarios.findMany({
        where: {
            id_rol: 2,
            estado: "activo",
            curso: { is: { id_grado: { in: [grade10.id, grade11.id] } } },
        },
        include: { curso: { include: { grado: true, jornada: true } } },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    return students.map((student) => ({
        id: student.id,
        nombre: `${student.nombre} ${student.apellido}`.trim(),
        grado: student.curso?.grado?.grado || "",
        grupo: student.curso?.jornada?.jornada || "",
        estado: student.estado,
        accionSugerida: "promover",
    }));
};

export const previewStudentMigration = async () => getMigrationStudents();

export const migrateStudents = async ({ anioOrigen, anioDestino, decisiones, ejecutadoPor }) => {
    const originYear = Number(anioOrigen);
    const destinationYear = Number(anioDestino);
    if (!Number.isInteger(originYear) || !Number.isInteger(destinationYear) || destinationYear <= originYear) {
        throw new Error("El año escolar de destino debe ser mayor al año de origen");
    }
    if (!Array.isArray(decisiones) || !decisiones.length) {
        throw new Error("Debes confirmar al menos una decisión de migración");
    }
    const previewStudents = await getMigrationStudents();
    const studentsById = new Map(previewStudents.map((student) => [student.id, student]));
    const selectedStudentIds = new Set();
    const normalizedDecisions = decisiones.map((decision) => {
        const studentId = Number(decision.estudianteId);
        const action = String(decision.accion || "").trim().toLowerCase();
        if (selectedStudentIds.has(studentId) || !studentsById.has(studentId) || !migrationActions.has(action)) {
            throw new Error("La vista previa contiene una decisión inválida");
        }
        selectedStudentIds.add(studentId);
        return { studentId, action, student: studentsById.get(studentId) };
    });

    return Prisma.$transaction(async (tx) => {
        const migration = await tx.migracion_academica.create({
            data: { anio_origen: originYear, anio_destino: destinationYear, ejecutado_por: Number(ejecutadoPor), estado: "confirmada" },
        });
        let promoted = 0;
        let retired = 0;
        let completed = 0;

        for (const { studentId, action, student } of normalizedDecisions) {
            const current = await tx.usuarios.findUnique({
                where: { id: studentId },
                include: { curso: { include: { grado: true } } },
            });
            if (!current || current.estado !== "activo") {
                throw new Error(`El estudiante ${student.nombre} ya no está activo`);
            }

            let nextCourseId = current.id_curso;
            let nextStatus = current.estado;
            if (action === "promover") {
                const currentGradeId = current.curso?.id_grado;
                if (current.curso?.grado?.grado === "10") {
                    const nextGrade = await tx.grado.findFirst({ where: { grado: "11" } });
                    if (!nextGrade) {
                        throw new Error("No existe el grado 11 configurado");
                    }
                    const nextCourse = await tx.curso.findFirst({
                        where: { id_grado: nextGrade.id, id_jornada: current.curso?.id_jornada },
                    });
                    if (!currentGradeId || !nextCourse) {
                        throw new Error(`No existe un curso de 11° para ${student.nombre}`);
                    }
                    nextCourseId = nextCourse.id;
                    promoted += 1;
                } else if (current.curso?.grado?.grado === "11") {
                    nextCourseId = null;
                    nextStatus = "retirado";
                    retired += 1;
                    completed += 1;
                } else {
                    throw new Error(`El estudiante ${student.nombre} no pertenece a 10° u 11°`);
                }
            }

            await tx.usuarios.update({
                where: { id: studentId },
                data: { id_curso: nextCourseId, estado: nextStatus, anio_escolar: destinationYear },
            });
            await tx.migracion_detalle.create({
                data: {
                    migracion_id: migration.id,
                    estudiante_id: studentId,
                    grado_anterior: student.grado || null,
                    grado_nuevo: action === "promover" && student.grado === "10" ? "11" : null,
                    estado_anterior: current.estado,
                    estado_nuevo: nextStatus,
                    accion: action,
                },
            });
        }

        return { id: migration.id, promoted, retired, completed, processed: normalizedDecisions.length };
    }, {
        maxWait: 10000,
        timeout: 20000,
    });
};