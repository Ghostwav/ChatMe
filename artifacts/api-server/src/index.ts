import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { createSocketServer } from "./lib/socket";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);
(app as any).io = io;

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
