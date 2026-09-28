import { Router, type IRouter } from "express";
import healthRouter from "./health";
import advisorRouter from "./advisor";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(advisorRouter);
router.use(historyRouter);

export default router;
