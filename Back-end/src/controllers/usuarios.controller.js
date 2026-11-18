import { createUsuariosService,deleteUsuariosService,readUsuariosService,updateUsuariosService,} from "../services/usuarios.service.js"

const stripPassword = (user) => {
    if (!user || typeof user !== "object") return user;
    const { contraseña, ...safeUser } = user;
    return safeUser;
};


export const readUsuarios = async (req, res) => {
    try{
        const users = await readUsuariosService();
        res.status(200).json(Array.isArray(users) ? users.map(stripPassword) : users);
    }catch(e){
        res.status(400).json({error: e.message});
    }
}
export  const createUsuarios = async (req, res) => {
    try{
        const user = await createUsuariosService(req.body);
        res.status(201).json(stripPassword(user));
    }catch(e){
        res.status(400).json({error: e.message});
    }

}
export const updateUsuarios = async (req, res) => {
    try{
        const id = Number(req.params.id);
        const user = await updateUsuariosService(id, req.body);
        res.status(200).json(stripPassword(user));
    }catch(e){
        res.status(400).json({error: e.message});
    }
}

export const deleteUsuarios = async (req, res) => {
    try{
        const id = Number(req.params.id);
        await deleteUsuariosService(id);
        res.status(200).json({message: "Usuario eliminado"});
    }catch(e){
        res.status(400).json({error: e.message});
    }
}