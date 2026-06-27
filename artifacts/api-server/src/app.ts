import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionMiddleware } from "./lib/session";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Credentialed CORS — required so session cookies are accepted cross-origin
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true }));

// Session middleware — must come before any route that uses req.session
app.use(sessionMiddleware);

// Attach Socket.IO instance to req so routes can emit events
app.use((req, _res, next) => {
  (req as any).io = (app as any).io;
  next();
});

app.use("/api", router);

export default app;
