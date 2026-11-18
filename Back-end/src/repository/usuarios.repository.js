import Prisma from "../prisma.js";

export const createUser = (userData) => {
    return Prisma.usuarios.create({ data: userData });
};

export const readUser = () => {
    return Prisma.usuarios.findMany();
};

export const updateUser = (userId, userData) => {
    return Prisma.usuarios.update({
        where: { id: userId },
        data: userData,
    });
};

export const deleteUser = (userId) => {
    return Prisma.usuarios.delete({
        where: { id: userId },
    });
};

export const findUserById = (id) => {
    return Prisma.usuarios.findUnique({ where: { id } });
};

export const readUserByEmail = (email) => {
    return Prisma.usuarios.findFirst({ where: { email } });
};

export const readUserByLoginIdentifier = (identifier) => {
    return Prisma.usuarios.findFirst({
        where: {
            OR: [
                { email: identifier },
                { numero_documento: identifier },
            ],
        },
    });
};

export const readUserByDocument = (numero_documento) => {
    return Prisma.usuarios.findUnique({ where: { numero_documento } });
};

export const findUserWithRelations = (id) => {
    return Prisma.usuarios.findUnique({
        where: { id },
        include: { rol: true, tipo_documento: true, curso: { include: { grado: true } }, lugar: true },
    });
};

export const FindUserById = findUserById;
export const readUserbyEmail = readUserByEmail;