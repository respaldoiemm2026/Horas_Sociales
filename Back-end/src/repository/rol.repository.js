import Prisma from "../prisma.js";

export const createRol = (rolData) => {
    return Prisma.rol.create({ data: rolData });
};

export const readRol = () => {
    return Prisma.rol.findMany();
};

export const updateRol = (rolId, rolData) => {
    return Prisma.rol.update({
        where: { id: rolId },
        data: rolData,
    });
};

export const deleteRol = (rolId) => {
    return Prisma.rol.delete({
        where: { id: rolId },
    });
};