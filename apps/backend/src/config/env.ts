import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGODB_URI || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

if (!config.mongoUri) {
  throw new Error("MONGODB_URI is required");
}
