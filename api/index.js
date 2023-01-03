import express from "express";
import session from "express-session";
import expressRateLimit from "express-rate-limit";
import { redisClient } from "./redis.js";
import connectRedis from "connect-redis";
import cors from "cors";
import crypto from "crypto";
import helmet from "helmet";
import responseTime from "response-time";
import winston from "winston";
import expressWinston from "express-winston";
import { createProxyMiddleware } from "http-proxy-middleware";

import { config } from "./config.js";
import { sendMail } from "./email.cjs";

const app = express();
const redisStore = connectRedis(session);
const alwaysAllow = (_req, _res, next) => {
    next();
};
const protect = (req, res, next) => {
    const { authenticated } = req.session;

    if (!authenticated) {
        res.sendStatus(401);
    } else {
        next();
    }
};

app.disable("x-powered-by");
app.use(cors());
app.use(helmet());
app.use(responseTime());
app.use(expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    statusLevels: true,
    meta: false,
    msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    expressFormat: true,
    ignoreRoute() {
        return false;
    },
}));
app.use(session({
    store: new redisStore({ client: redisClient }),
    secret: crypto.randomBytes(50).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 10
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressRateLimit(config.rate));
Object.keys(config.proxies).forEach((path) => {
    const { guarded, ...options } = config.proxies[path];
    const check = guarded ? protect : alwaysAllow;
    app.use(path, check, createProxyMiddleware(options));
});

app.post("/request-otp", async (req, res, next) => {
    const { email } = req.body;
    const otp = crypto.randomBytes(3).toString("hex");

    req.session.otp = otp;
    req.session.email = email;

    await sendMail(req.session.email, "mcwake-dev@outlook.com", "Your One-Time Password", `Your OTP is ${otp}`, `Your OTP is <b>${otp}</b>`)

    res.sendStatus(200);
});

app.post("/authenticate", (req, res, next) => {
    const { otp } = req.body;

    if (otp === req.session.otp) {
        req.session.authenticated = true;
        delete req.session.otp;

        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.get("/authenticated", (req, res, next) => {
    if (req.session.authenticated) {
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.get("/logout", (req, res, next) => {
    req.session.destroy();

    res.sendStatus(200);
})

export { app };