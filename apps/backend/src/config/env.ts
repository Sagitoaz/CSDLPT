import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

function parseCorsOrigins(rawValue: string | undefined): string[] | "*" {
  const origins = (rawValue || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes("*")) {
    return "*";
  }

  return origins.length > 0 ? origins : ["http://100.105.34.84:5174:5174"];
}

export const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGODB_URI || "",
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
};

if (!config.mongoUri) {
  throw new Error("MONGODB_URI is required");
}
