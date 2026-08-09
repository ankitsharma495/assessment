import app from "./app";
import { connectDB } from "./config/database";

const PORT = Number(process.env.PORT) || 5001;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
  });
};

startServer();
