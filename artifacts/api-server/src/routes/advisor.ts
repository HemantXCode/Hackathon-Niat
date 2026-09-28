import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  CreateCropAdvisoryBody,
  CreateCropAdvisoryResponse,
  CreatePestAdvisoryBody,
  CreatePestAdvisoryResponse,
} from "@workspace/api-zod";
import {
  advisoryRequestsTable,
  aiResponsesTable,
  db,
  usersTable,
} from "@workspace/db";
import { generateCropAdvisory, generatePestAdvisory } from "../lib/ai";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_EMAIL = "farmer@agroadvisor.local";

const router: IRouter = Router();

async function ensureDemoUser(): Promise<void> {
  await db
    .insert(usersTable)
    .values({ id: DEMO_USER_ID, email: DEMO_EMAIL })
    .onConflictDoNothing({ target: usersTable.id });
}

async function saveAdvisory(
  advisoryType: "CROP_REC" | "PEST_DIAG",
  inputPayload: Record<string, unknown>,
  structuredData: Record<string, unknown>,
): Promise<string> {
  await ensureDemoUser();
  const [request] = await db
    .insert(advisoryRequestsTable)
    .values({ userId: DEMO_USER_ID, advisoryType, inputPayload })
    .returning({ id: advisoryRequestsTable.id });

  if (!request) {
    throw new Error("Unable to save advisory request");
  }

  await db.insert(aiResponsesTable).values({
    requestId: request.id,
    structuredData,
  });

  return request.id;
}

router.post("/advisor/crop", async (req, res): Promise<void> => {
  const parsed = CreateCropAdvisoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const structuredData = await generateCropAdvisory(parsed.data);
    const id = await saveAdvisory(
      "CROP_REC",
      parsed.data,
      structuredData as unknown as Record<string, unknown>,
    );
    const result = CreateCropAdvisoryResponse.parse({
      id,
      advisoryType: "CROP_REC",
      inputPayload: parsed.data,
      structuredData,
      createdAt: new Date(),
    });
    res.status(201).json(result);
  } catch (error) {
    req.log.error({ err: error }, "Failed to create crop advisory");
    res.status(500).json({ error: "Unable to create crop advisory" });
  }
});

router.post("/advisor/pest", async (req, res): Promise<void> => {
  const parsed = CreatePestAdvisoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const structuredData = await generatePestAdvisory(parsed.data);
    const id = await saveAdvisory(
      "PEST_DIAG",
      parsed.data,
      structuredData as unknown as Record<string, unknown>,
    );
    const result = CreatePestAdvisoryResponse.parse({
      id,
      advisoryType: "PEST_DIAG",
      inputPayload: parsed.data,
      structuredData,
      createdAt: new Date(),
    });
    res.status(201).json(result);
  } catch (error) {
    req.log.error({ err: error }, "Failed to create pest advisory");
    res.status(500).json({ error: "Unable to create pest advisory" });
  }
});

export { ensureDemoUser };
export default router;