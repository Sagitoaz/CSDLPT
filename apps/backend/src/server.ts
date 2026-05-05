import { createApp } from "./app/create-app";
import { config } from "./config/env";
import { connectMongo } from "./infrastructure/database/mongo";
import { triggerDemo } from "./trigger/trigger";

async function bootstrap(): Promise<void> {
  await connectMongo();
  await triggerDemo();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Backend listening on http://0.0.0.0:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Cannot start backend", err);
  process.exit(1);
});
