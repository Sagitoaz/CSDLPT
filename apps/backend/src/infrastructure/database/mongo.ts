import mongoose from "mongoose";
import { config } from "../../config/env";

export async function connectMongo(): Promise<void> {
  await mongoose.connect(config.mongoUri, {
    dbName: "charity_distributed"
  });
}
