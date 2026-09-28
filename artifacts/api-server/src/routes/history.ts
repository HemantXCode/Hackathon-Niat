import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  GetAdvisoryReportParams,
  GetAdvisoryReportResponse,
  GetDashboardSummaryResponse,
  ListAdvisoryHistoryQueryParams,
  ListAdvisoryHistoryResponse,
} from "@workspace/api-zod";
import {
  advisoryRequestsTable,
  aiResponsesTable,
  db,
} from "@workspace/db";
import { DEMO_USER_ID, ensureDemoUser } from "./advisor";

const router: IRouter = Router();

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

function makeSummary(
  request: {
    id: string;
    advisoryType: string;
    inputPayload: unknown;
    createdAt: Date;
  },
) {
  const payload = asRecord(request.inputPayload);
  const title =
    request.advisoryType === "CROP_REC"
      ? `Crop plan for ${String(payload.location ?? "your farm")}`
      : `${String(payload.cropName ?? "Crop")} health check`;
  const subtitle =
    request.advisoryType === "CROP_REC"
      ? `${String(payload.soilType ?? "Soil")} soil · ${String(payload.farmSizeAcres ?? "")} acres`
      : `${String(payload.plantPartAffected ?? "Plant")} · ${String(payload.durationDays ?? "")} days of symptoms`;

  return {
    id: request.id,
    advisoryType: request.advisoryType,
    title,
    subtitle,
    createdAt: request.createdAt,
  };
}

router.get("/history", async (req, res): Promise<void> => {
  const parsed = ListAdvisoryHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await ensureDemoUser();
    const rows = await db
      .select({
        request: advisoryRequestsTable,
        response: aiResponsesTable,
      })
      .from(advisoryRequestsTable)
      .innerJoin(
        aiResponsesTable,
        eq(aiResponsesTable.requestId, advisoryRequestsTable.id),
      )
      .where(eq(advisoryRequestsTable.userId, DEMO_USER_ID))
      .orderBy(desc(advisoryRequestsTable.createdAt));

    const search = parsed.data.search?.toLowerCase();
    const summaries = rows
      .map(({ request }) => makeSummary(request))
      .filter((summary) => {
        const typeMatch =
          parsed.data.type === "all" || summary.advisoryType === parsed.data.type;
        const searchMatch =
          !search ||
          `${summary.title} ${summary.subtitle}`.toLowerCase().includes(search);
        return typeMatch && searchMatch;
      });

    res.json(ListAdvisoryHistoryResponse.parse(summaries));
  } catch (error) {
    req.log.error({ err: error }, "Failed to list advisory history");
    res.status(500).json({ error: "Unable to load advisory history" });
  }
});

router.get("/history/:id", async (req, res): Promise<void> => {
  const params = GetAdvisoryReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await ensureDemoUser();
    const [row] = await db
      .select({
        request: advisoryRequestsTable,
        response: aiResponsesTable,
      })
      .from(advisoryRequestsTable)
      .innerJoin(
        aiResponsesTable,
        eq(aiResponsesTable.requestId, advisoryRequestsTable.id),
      )
      .where(eq(advisoryRequestsTable.id, params.data.id));

    if (!row || row.request.userId !== DEMO_USER_ID) {
      res.status(404).json({ error: "Advisory report not found" });
      return;
    }

    res.json(
      GetAdvisoryReportResponse.parse({
        id: row.request.id,
        advisoryType: row.request.advisoryType,
        inputPayload: row.request.inputPayload,
        structuredData: row.response.structuredData,
        createdAt: row.request.createdAt,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to load advisory report");
    res.status(500).json({ error: "Unable to load advisory report" });
  }
});

router.get("/dashboard", async (req, res): Promise<void> => {
  try {
    await ensureDemoUser();
    const rows = await db
      .select({ request: advisoryRequestsTable })
      .from(advisoryRequestsTable)
      .where(eq(advisoryRequestsTable.userId, DEMO_USER_ID))
      .orderBy(desc(advisoryRequestsTable.createdAt));

    const recent = rows.slice(0, 5).map(({ request }) => makeSummary(request));
    const result = GetDashboardSummaryResponse.parse({
      totalConsultations: rows.length,
      cropPlans: rows.filter(({ request }) => request.advisoryType === "CROP_REC")
        .length,
      pestDiagnoses: rows.filter(
        ({ request }) => request.advisoryType === "PEST_DIAG",
      ).length,
      recent,
    });
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load dashboard summary");
    res.status(500).json({ error: "Unable to load dashboard summary" });
  }
});

export default router;