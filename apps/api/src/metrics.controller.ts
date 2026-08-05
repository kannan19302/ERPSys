import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { metricsRegistry } from "./common/middleware/metrics.middleware";
import { Public } from "./common/decorators/public.decorator";

@Controller()
export class MetricsController {
  @Public(
    "Prometheus scrape endpoint. Exposes aggregate process metrics, no tenant data; restricted at the ingress, not in application code.",
  )
  @Get("metrics")
  async getMetrics(@Res() res: Response) {
    res.set("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  }
}
