import { createApp } from "./app/create-app";
import { config } from "./config/env";
import { connectMongo } from "./infrastructure/database/mongo";

async function bootstrap(): Promise<void> {
  await connectMongo();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Cannot start backend", err);
  process.exit(1);
});
