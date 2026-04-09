import express from "express";
import donationRoutes from "./donation.routes";
import { config } from "./config";
import { connectMongo } from "./db";
import { applySecurity } from "./security";

async function bootstrap(): Promise<void> {
  await connectMongo();

  const app = express();
  applySecurity(app);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "charity-backend" });
  });

  app.use("/api/donations", donationRoutes);

  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Cannot start backend", err);
  process.exit(1);
});
