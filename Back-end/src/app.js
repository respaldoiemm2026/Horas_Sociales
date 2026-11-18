import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import usuario from "./routers/usuarios.routers.js";
import tipo_documento from "./routers/tipo_documento.routers.js";
import rol from "./routers/rol.routers.js";
import registro from "./routers/registros.routers.js";
import lugar from "./routers/lugar.routers.js";
import jornada from "./routers/jornada.routers.js";
import curso from "./routers/curso.routers.js";
import grado from "./routers/grado.routers.js";
import authRouter from "./routers/auth.routers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "../../front-end/src");

const app = express();
app.disable("x-powered-by");

app.use(express.json({ limit: "200kb" }));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origen no permitido"));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.static(frontendPath));

app.use("/usuario", usuario);
app.use("/tipo_documento", tipo_documento);
app.use("/rol", rol);
app.use("/registro", registro);
app.use("/lugar", lugar);
app.use("/jornada", jornada);
app.use("/grado", grado);
app.use("/curso", curso);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("hola....");
});

export default app;
