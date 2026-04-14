import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import express from "express";
import httpMocks from "node-mocks-http";
import { createCampaignRoutes } from "./campaign.routes";
import { CampaignService } from "./campaign.service";
import { registerErrorHandler } from "../../common/http";

function buildMockCampaignService(overrides: Partial<CampaignService> = {}): CampaignService {
  return {
    list: async () => ({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }),
    getByCode: async () => null,
    create: async () => ({ code: "hoc-bong-2026", name: "Hoc bong 2026", targetAmount: 1000000 }),
    updateByCode: async () => null,
    removeByCode: async () => false,
    getSummary: async () => ({ total: 0, active: 0, inactive: 0 }),
    ...overrides
  };
}

async function invokeRoute(
  app: express.Express,
  method: string,
  url: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const req = httpMocks.createRequest({
    method,
    url,
    body,
    headers: { "content-type": "application/json" }
  });

  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("end", () => resolve());
    app.handle(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  const data = res._getData();
  let parsedBody: unknown = data;
  if (typeof data === "string" && data.length > 0) {
    try {
      parsedBody = JSON.parse(data);
    } catch {
      parsedBody = data;
    }
  }

  return { status: res.statusCode, body: parsedBody };
}

test("GET /api/campaigns supports query parsing", async () => {
  let receivedActive: boolean | undefined;
  const app = express();
  app.use(express.json());
  app.use(
    "/api/campaigns",
    createCampaignRoutes(
      buildMockCampaignService({
        list: async (query) => {
          receivedActive = query.isActive;
          return {
            data: [],
            pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 0 }
          };
        }
      })
    )
  );
  registerErrorHandler(app);

  const res = await invokeRoute(app, "GET", "/api/campaigns?isActive=true&page=2");
  assert.equal(res.status, 200);
  assert.equal(receivedActive, true);
});

test("POST /api/campaigns validates date range", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/campaigns", createCampaignRoutes(buildMockCampaignService()));
  registerErrorHandler(app);

  const res = await invokeRoute(app, "POST", "/api/campaigns", {
    code: "hoc-bong-2026",
    name: "Hoc bong",
    targetAmount: 10000,
    startDate: "2026-12-31",
    endDate: "2026-01-01"
  });
  assert.equal(res.status, 400);
});
