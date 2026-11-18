import "dotenv/config";
import app from "./app.js";

const startServer = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => {
      console.log(`server listo http://localhost:${port}`);
    });
  } catch (error) {
    console.log("error en el server", error);
  }
};

startServer();
