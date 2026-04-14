import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import express from "express";
import httpMocks from "node-mocks-http";
import { createDonationRoutes } from "./donation.routes";
import { registerErrorHandler } from "../../common/http";
import { DonationService } from "./donation.service";

function buildMockDonationService(overrides: Partial<DonationService> = {}): DonationService {
  return {
    list: async () => ({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }),
    getById: async () => null,
    create: async () => ({ _id: "d1", donorName: "Alice" }),
    update: async () => null,
    updateStatus: async () => null,
    remove: async () => false,
    aggregateOverview: async () => ({ totalDonations: 0, totalAmount: 0, byStatus: [] }),
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

test("GET /api/donations returns paginated payload", async () => {
  let receivedPage = 0;
  const service = buildMockDonationService({
    list: async (query) => {
      receivedPage = query.page;
      return {
        data: [{ _id: "d1", donorName: "Alice" }],
        pagination: { page: query.page, limit: query.limit, total: 1, totalPages: 1 }
      };
    }
  });

  const app = express();
  app.use(express.json());
  app.use("/api/donations", createDonationRoutes(service));
  registerErrorHandler(app);

  const res = await invokeRoute(app, "GET", "/api/donations?page=2&limit=5");
  assert.equal(res.status, 200);
  assert.equal((res.body as any).pagination.page, 2);
  assert.equal(receivedPage, 2);
});

test("POST /api/donations validates body", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/donations", createDonationRoutes(buildMockDonationService()));
  registerErrorHandler(app);

  const res = await invokeRoute(app, "POST", "/api/donations", { donorName: "A" });
  assert.equal(res.status, 400);
});

test("PATCH /api/donations/:id/status returns 404 when donation missing", async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/donations",
    createDonationRoutes(
      buildMockDonationService({
        updateStatus: async () => null
      })
    )
  );
  registerErrorHandler(app);

  const res = await invokeRoute(app, "PATCH", "/api/donations/d100/status", {
    status: "verified"
  });
  assert.equal(res.status, 404);
});
