import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { chromium } from "playwright-core";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { Telegraf } from "telegraf";
import crypto from "crypto";
import { getDb } from "../shared/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fresko-super-secret-key-parser";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "fresko_parser_bot";
const CRYPTO_BOT_TOKEN = process.env.CRYPTO_BOT_TOKEN || "";
const IS_DESKTOP_APP = process.env.DESKTOP_APP === "1";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB
  const db = await getDb();

  // Initialize Telegraf Bot
  let bot: Telegraf | null = null;
  if (TELEGRAM_BOT_TOKEN && !IS_DESKTOP_APP) {
    bot = new Telegraf(TELEGRAM_BOT_TOKEN);
    bot.start(async (ctx) => {
      const payload = ctx.payload;
      
      if (payload.startsWith("login_")) {
        const code = payload.replace("login_", "");
        const telegramId = ctx.from.id.toString();
        const username = ctx.from.username || ctx.from.first_name;
        
        let user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
        if (!user) {
          const id = uuidv4();
          await db.run(
            `INSERT INTO users (id, username, telegram_id, plan) VALUES (?, ?, ?, ?)`,
            [id, username, telegramId, 'NONE']
          );
          user = { id, username, telegram_id: telegramId, plan: 'NONE' };
        }
        
        await db.run(`UPDATE telegram_auth_requests SET status = 'completed', user_id = ? WHERE code = ?`, [user.id, code]);
        ctx.reply("вњ… РЈСЃРїРµС€РЅР°СЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ! Р’РµСЂРЅРёС‚РµСЃСЊ РЅР° СЃР°Р№С‚.");
      } else if (payload.startsWith("link_")) {
        const code = payload.replace("link_", "");
        const telegramId = ctx.from.id.toString();
        
        const req = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [code]);
        if (req && req.user_id) {
          await db.run(`UPDATE users SET telegram_id = ? WHERE id = ?`, [telegramId, req.user_id]);
          await db.run(`UPDATE telegram_auth_requests SET status = 'completed' WHERE code = ?`, [code]);
          ctx.reply("рџ”— Telegram СѓСЃРїРµС€РЅРѕ РїСЂРёРІСЏР·Р°РЅ! Р’РµСЂРЅРёС‚РµСЃСЊ РЅР° СЃР°Р№С‚.");
        } else {
          ctx.reply("вќЊ РќРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅС‹Р№ РёР»Рё СѓСЃС‚Р°СЂРµРІС€РёР№ РєРѕРґ РїСЂРёРІСЏР·РєРё.");
        }
      } else {
        ctx.reply(
          `рџљЂ *Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ СЌРєРѕСЃРёСЃС‚РµРјСѓ FRESKO CT!*\n\n` +
          `РЇ вЂ” РѕС„РёС†РёР°Р»СЊРЅС‹Р№ Р±РѕС‚ РїР°СЂСЃРµСЂР°. Р—РґРµСЃСЊ РІС‹ РјРѕР¶РµС‚Рµ:\n` +
          `вЂў РђРІС‚РѕСЂРёР·РѕРІР°С‚СЊСЃСЏ РЅР° СЃР°Р№С‚Рµ\n` +
          `вЂў РџРѕР»СѓС‡Р°С‚СЊ СѓРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РІС‹РїРѕР»РЅРµРЅРёРё Р·Р°РґР°С‡\n` +
          `вЂў РћР±СЂР°С‰Р°С‚СЊСЃСЏ РІ РїРѕРґРґРµСЂР¶РєСѓ\n\n` +
          `РСЃРїРѕР»СЊР·СѓР№С‚Рµ РєРЅРѕРїРєРё РјРµРЅСЋ РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ.`, 
          { parse_mode: 'Markdown' }
        );
      }
    });

    bot.command('status', requireAuthBot, async (ctx: any) => {
      const user = ctx.user;
      ctx.reply(`рџ‘¤ *РџСЂРѕС„РёР»СЊ:* ${user.username}\nрџ’Ћ *РџР»Р°РЅ:* ${user.plan}\nрџ’° *Р‘Р°Р»Р°РЅСЃ:* ${user.balance}$`, { parse_mode: 'Markdown' });
    });

    bot.launch().then(() => {
      console.log("Telegram bot launched!");
      bot?.telegram.setMyCommands([
        { command: 'start', description: 'Р—Р°РїСѓСЃС‚РёС‚СЊ Р±РѕС‚Р°' },
        { command: 'status', description: 'РџСЂРѕРІРµСЂРёС‚СЊ СЃС‚Р°С‚СѓСЃ РїРѕРґРїРёСЃРєРё' },
        { command: 'help', description: 'РџРѕРјРѕС‰СЊ' }
      ]);
    }).catch((e) => {
      console.log("Failed to launch bot:", e);
    });
  }

  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

  async function notifyAdmin(message: string) {
    if (ADMIN_TELEGRAM_ID && bot) {
      try {
        await bot.telegram.sendMessage(ADMIN_TELEGRAM_ID, `рџ”” [ADMIN NOTIFY]\n${message}`);
      } catch (e) {
        console.error("Failed to notify admin via TG:", e);
      }
    }
  }

  async function logAuth(userId: string, req: any) {
    try {
      const id = uuidv4();
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      await db.run(`INSERT INTO auth_logs (id, user_id, ip, user_agent) VALUES (?, ?, ?, ?)`, [id, userId, ip, ua]);
    } catch (e) {
      console.error("Failed to log auth:", e);
    }
  }

  // Middleware for Auth
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch(e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // In-memory data store for the session
  const tasks: any[] = [];
  const proxies: any[] = [];
  const results: any[] = [];

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.get("/api/desktop/status", (req, res) => {
    if (!IS_DESKTOP_APP) return res.status(404).json({ error: "Desktop mode is disabled" });
    res.json({
      mode: "desktop",
      tasks: tasks.length,
      results: results.length,
      running: tasks.filter((task) => !["completed", "failed"].includes(String(task.status).toLowerCase())).length,
    });
  });

  app.get("/api/desktop/tasks", (req, res) => {
    if (!IS_DESKTOP_APP) return res.status(404).json({ error: "Desktop mode is disabled" });
    res.json([...tasks].reverse());
  });

  app.post("/api/desktop/tasks", async (req, res) => {
    if (!IS_DESKTOP_APP) return res.status(404).json({ error: "Desktop mode is disabled" });

    const {
      keyword,
      engine = "google",
      country = "ru",
      limit = 40,
      filters = ["email", "phone"],
    } = req.body || {};

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    const taskId = uuidv4();
    const safeLimit = Math.max(1, Math.min(Number(limit) || 40, 500));
    const safeFilters = Array.isArray(filters) && filters.length ? filters : ["email", "phone"];
    const newTask: any = {
      id: taskId,
      userId: "desktop",
      keyword,
      engine,
      country,
      status: "queued",
      progress: 0,
      resultsCount: 0,
      limit: safeLimit,
      filters: safeFilters,
      logs: ["Task queued in local desktop engine"],
      createdAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    runParser(taskId, keyword, engine, undefined, safeLimit, safeFilters, country).catch((error) => {
      newTask.status = "failed";
      newTask.error = String(error);
      newTask.logs.unshift(`[${new Date().toLocaleTimeString()}] ${String(error)}`);
    });

    res.json({ success: true, taskId });
  });

  app.get("/api/desktop/results", (req, res) => {
    if (!IS_DESKTOP_APP) return res.status(404).json({ error: "Desktop mode is disabled" });
    const { taskId } = req.query;
    const output = taskId ? results.filter((result) => result.taskId === taskId) : results;
    res.json([...output].reverse());
  });

  app.get("/api/desktop/results/export", (req, res) => {
    if (!IS_DESKTOP_APP) return res.status(404).json({ error: "Desktop mode is disabled" });
    const { taskId } = req.query;
    const exportResults = taskId ? results.filter((result) => result.taskId === taskId) : results;
    let csv = "ID,Type,Value,Query,Source,Found At\n";

    exportResults.forEach((result) => {
      const task = tasks.find((item) => item.id === result.taskId);
      const query = task ? String(task.keyword).replace(/"/g, '""') : "Unknown";
      csv += `"${result.id}","${result.type}","${result.value}","${query}","${result.source}","${result.foundAt}"\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=fresko_results_${taskId || "all"}.csv`);
    res.send("\uFEFF" + csv);
  });
  
  // -- AUTH ROUTES --
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Missing fields" });

      const existingParams = email ? [username, email] : [username];
      const existingQuery = email ? `username = ? OR email = ?` : `username = ?`;
      const existing = await db.get(`SELECT id FROM users WHERE ${existingQuery}`, existingParams);
      if (existing) return res.status(400).json({ error: "User already exists" });

      const id = uuidv4();
      const hash = await bcrypt.hash(password, 10);
      
      await db.run(
        `INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)`,
        [id, email || null, username, hash]
      );

      await logAuth(id, req);

      const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id, username, email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { login, password } = req.body;
      if (!login || !password) return res.status(400).json({ error: "Missing fields" });

      const user = await db.get(`SELECT * FROM users WHERE username = ? OR email = ?`, [login, login]);
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, plan: user.plan } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const user = await db.get(`SELECT id, username, email, telegram_id, plan, balance FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  });

  app.post("/api/auth/telegram/callback", async (req, res) => {
    try {
      const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
      
      if (!TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: "Bot token not configured" });

      // Verify Telegram hash
      const dataCheckArr = [];
      for (const key in req.body) {
        if (key !== 'hash') dataCheckArr.push(`${key}=${req.body[key]}`);
      }
      dataCheckArr.sort();
      const dataCheckString = dataCheckArr.join('\n');
      const secretKey = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (hmac !== hash) {
        return res.status(401).json({ error: "Invalid hash" });
      }

      // Check auth_date (max 24h old)
      if (Date.now() / 1000 - Number(auth_date) > 86400) {
        return res.status(401).json({ error: "Data is outdated" });
      }

      const telegramId = id.toString();
      let user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
      
      if (!user) {
        const newId = uuidv4();
        const finalUsername = username || first_name || `user_${telegramId}`;
        await db.run(
          `INSERT INTO users (id, username, telegram_id, plan) VALUES (?, ?, ?, ?)`,
          [newId, finalUsername, telegramId, 'NONE']
        );
        user = { id: newId, username: finalUsername, plan: 'NONE' };
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy for requireAuth in Bot context
  async function requireAuthBot(ctx: any, next: any) {
    const telegramId = ctx.from.id.toString();
    const user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
    if (!user) return ctx.reply("вќЊ Р’С‹ РЅРµ Р°РІС‚РѕСЂРёР·РѕРІР°РЅС‹. РЎРЅР°С‡Р°Р»Р° РІРѕР№РґРёС‚Рµ РЅР° СЃР°Р№С‚Рµ.");
    ctx.user = user;
    return next();
  }

  // BILLING ROUTES
  app.post("/api/billing/invoice", requireAuth, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const plans = {
        "1m": { amount: 30, asset: "USDT" },
        "3m": { amount: 60, asset: "USDT" },
        "1y": { amount: 200, asset: "USDT" },
        "forever": { amount: 150, asset: "USDT" }
      };
      
      const plan = plans[planId as keyof typeof plans];
      if (!plan) return res.status(400).json({ error: "Invalid plan" });

      const cryptoBotToken = process.env.CRYPTO_BOT_TOKEN;

      if (!cryptoBotToken) {
        // Return placeholder or manual payment link since no token provided yet
        return res.json({ pay_url: `https://t.me/Fresko_CT?text=РҐРѕС‡Сѓ+РѕРїР»Р°С‚РёС‚СЊ+РїР»Р°РЅ+${planId}` });
      }

      const response = await fetch("https://pay.crypt.bot/api/createInvoice", {
        method: "POST",
        headers: {
          "Crypto-Pay-API-Token": cryptoBotToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asset: plan.asset,
          amount: plan.amount.toString(),
          description: `РћРїР»Р°С‚Р° С‚Р°СЂРёС„Р° ${planId} РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ ${req.user.username}`,
          payload: `${req.user.id}:${planId}` // We will process this on webhook
        })
      });

      const data = await response.json();
      if (data.ok) {
        res.json({ pay_url: data.result.pay_url });
      } else {
        res.status(500).json({ error: "РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ РёРЅРІРѕР№СЃР° (CryptoBot)" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const signature = req.headers["crypto-pay-api-signature"];
      if (!signature || !CRYPTO_BOT_TOKEN) {
        return res.status(400).send("No signature or token");
      }

      // Verify signature
      const secret = crypto.createHash('sha256').update(CRYPTO_BOT_TOKEN).digest();
      const checkString = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

      if (hmac !== signature) {
        return res.status(401).send("Invalid signature");
      }

      const update = req.body;
      if (update.update_type === "invoice_paid") {
        const payload = update.payload.payload;
        if (payload) {
          const [userId, planId] = payload.split(":");
          if (userId && planId) {
            // Check if it's a plan or just a balance deposit
            if (planId.startsWith("balance_")) {
              const amount = parseFloat(planId.split("_")[1]);
              await db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId]);
              await db.run(`INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)`,
                [uuidv4(), userId, amount, 'deposit', `РџРѕРїРѕР»РЅРµРЅРёРµ Р±Р°Р»Р°РЅСЃР° С‡РµСЂРµР· CryptoBot`]);
            } else {
              await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [planId, userId]);
            }
            console.log(`Processed payment for user ${userId}: ${planId}`);
          }
        }
      }
      
      res.sendStatus(200);
    } catch(e) {
      console.error("Webhook error:", e);
      res.sendStatus(500);
    }
  });

  // ADMIN ROUTES
  // TASK ROUTES
  app.get("/api/tasks", requireAuth, async (req: any, res) => {
    const userTasks = await db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]);
    res.json(userTasks);
  });

  app.post("/api/tasks", requireAuth, async (req: any, res) => {
    const { category, service, link, limit, filters, country } = req.body;
    
    const user = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
    if (!user.plan || user.plan === "FREE" || user.plan === "NONE") {
      return res.status(403).json({ error: "РќРµРѕР±С…РѕРґРёРјР° Р°РєС‚РёРІРЅР°СЏ РїРѕРґРїРёСЃРєР°" });
    }

    const taskId = uuidv4();
    await db.run(`INSERT INTO orders (id, user_id, category, service, link, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, req.user.id, category, service, link, 'pending']);
    
    // Start background parser
    // Use tasks array for real-time tracking if needed, or just rely on DB
    const newTask = {
      id: taskId,
      userId: req.user.id,
      keyword: link, // mapping link to keyword for parser
      engine: "google",
      country: country || "ru",
      status: "pending",
      progress: 0,
      resultsCount: 0,
      limit: limit || 10,
      filters: filters || ["email", "phone"],
      logs: ["Р—Р°РґР°С‡Р° РїРѕСЃС‚Р°РІР»РµРЅР° РІ РѕС‡РµСЂРµРґСЊ"],
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);

    runParser(taskId, newTask.keyword, newTask.engine, undefined, newTask.limit, newTask.filters, newTask.country).catch(console.error);

    res.json({ success: true, taskId });
  });

  // TICKET ROUTES
  app.post("/api/tickets", requireAuth, async (req: any, res) => {
    const { subject, message } = req.body;
    const id = uuidv4();
    await db.run(`INSERT INTO tickets (id, user_id, subject) VALUES (?, ?, ?)`, [id, req.user.id, subject]);
    await notifyAdmin(`рџЋ« РќРѕРІС‹Р№ С‚РёРєРµС‚!\nUser: ${req.user.username}\nSubject: ${subject}\nMessage: ${message}`);
    res.json({ success: true, ticketId: id });
  });

  app.get("/api/tickets", requireAuth, async (req: any, res) => {
    const tickets = await db.all(`SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]);
    res.json(tickets);
  });

  // PROMO ROUTES
  app.post("/api/billing/promo/validate", requireAuth, async (req: any, res) => {
    const { code } = req.body;
    const now = new Date().toISOString();
    const promo = await db.get(`SELECT * FROM promo_codes WHERE code = ? AND (expires_at IS NULL OR expires_at > ?)`, [code, now]);
    
    if (!promo) return res.status(404).json({ error: "РџСЂРѕРјРѕРєРѕРґ РЅРµ РЅР°Р№РґРµРЅ РёР»Рё РёСЃС‚РµРє" });
    if (promo.current_usages >= promo.max_usages) return res.status(400).json({ error: "РџСЂРѕРјРѕРєРѕРґ РёСЃРїРѕР»СЊР·РѕРІР°РЅ РјР°РєСЃРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ СЂР°Р·" });

    res.json(promo);
  });

  // ADMIN ROUTES
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    const admin = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
    if (admin?.plan !== "ADMIN") return res.status(403).json({ error: "Access denied" });

    const users = await db.all(`SELECT id, username, email, plan, created_at FROM users`);
    res.json(users);
  });

  app.post("/api/admin/users/balance", requireAuth, async (req: any, res) => {
    const admin = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
    if (admin?.plan !== "ADMIN") return res.status(403).json({ error: "Access denied" });

    const { targetId, amount, type } = req.body; // type: 'set' or 'add'
    if (type === 'set') {
      await db.run(`UPDATE users SET balance = ? WHERE id = ?`, [amount, targetId]);
    } else {
      await db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, targetId]);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/promo", requireAuth, async (req: any, res) => {
    const admin = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
    if (admin?.plan !== "ADMIN") return res.status(403).json({ error: "Access denied" });

    const promos = await db.all(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
    res.json(promos);
  });

  app.post("/api/admin/promo", requireAuth, async (req: any, res) => {
    const admin = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
    if (admin?.plan !== "ADMIN") return res.status(403).json({ error: "Access denied" });

    const { code, discount_percent, max_usages, expires_at } = req.body;
    await db.run(`INSERT INTO promo_codes (id, code, discount_percent, max_usages, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), code, discount_percent, max_usages, expires_at || null]);
    res.json({ success: true });
  });

  app.post("/api/admin/grant-plan", requireAuth, async (req: any, res) => {
    try {
      const user = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
      if (user?.plan !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { targetId, planId } = req.body;
      if (!targetId || !planId) return res.status(400).json({ error: "Missing parameters" });

      // Find user by ID or username or telegram_id
      const targetUser = await db.get(`SELECT id FROM users WHERE id = ? OR username = ? OR email = ?`, [targetId, targetId, targetId]);
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [planId, targetUser.id]);
      res.json({ success: true, message: `РџР»Р°РЅ ${planId} РІС‹РґР°РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ` });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // TELEGRAM ROUTES
  app.post("/api/auth/telegram/request", async (req, res) => {
    const code = uuidv4();
    await db.run(
      `INSERT INTO telegram_auth_requests (id, code, status) VALUES (?, ?, 'pending')`,
      [uuidv4(), code]
    );
    res.json({ code, botUsername: TELEGRAM_BOT_USERNAME });
  });

  app.get("/api/auth/telegram/status/:code", async (req, res) => {
    const request = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [req.params.code]);
    if (!request) return res.status(404).json({ error: "Not found" });
    
    if (request.status === "completed" && request.user_id) {
      const user = await db.get(`SELECT id, username, email, plan FROM users WHERE id = ?`, [request.user_id]);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ status: "completed", user });
    } else {
      res.json({ status: "pending" });
    }
  });

  app.post("/api/auth/telegram/link", requireAuth, async (req: any, res) => {
    const code = uuidv4();
    await db.run(
      `INSERT INTO telegram_auth_requests (id, user_id, code, status) VALUES (?, ?, ?, 'pending')`,
      [uuidv4(), req.user.id, code]
    );
    res.json({ code, botUsername: TELEGRAM_BOT_USERNAME });
  });

  app.get("/api/auth/telegram/link-status/:code", requireAuth, async (req, res) => {
    const request = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [req.params.code]);
    if (!request) return res.status(404).json({ error: "Not found" });
    
    if (request.status === "completed") {
      res.json({ status: "completed" });
    } else {
      res.json({ status: "pending" });
    }
  });

  // -- APP ROUTES --
  app.get("/api/download/desktop", requireAuth, async (req, res) => {
    const releaseDir = path.join(process.cwd(), "releases");
    const candidates = [
      path.join(releaseDir, "PARSER-Setup.exe"),
      path.join(releaseDir, "PARSER Setup.exe")
    ];

    for (const filePath of candidates) {
      try {
        await fs.access(filePath);
        return res.download(filePath, path.basename(filePath));
      } catch {
        // Try the next known installer filename.
      }
    }

    res.status(404).json({ error: "Desktop installer is not uploaded yet" });
  });

  app.get("/api/proxies", requireAuth, (req, res) => {
    res.json(proxies.filter(p => p.userId === (req as any).user.id));
  });

  // VLESS Link Parser Helper
  function parseVless(link: string) {
    try {
      const url = new URL(link);
      const uuid = url.username;
      const host = url.hostname;
      const port = url.port;
      const params = Object.fromEntries(url.searchParams);
      return { uuid, host, port, ...params };
    } catch (e) {
      return null;
    }
  }

  app.post("/api/proxies", requireAuth, (req, res) => {
    const { name, url } = req.body;
    const parsed = parseVless(url);
    const newProxy = { 
      id: uuidv4(), 
      userId: (req as any).user.id,
      name, 
      url, 
      status: "active",
      type: url.startsWith("vless://") ? "VLESS" : "SOCKS/HTTP",
      details: parsed
    };
    proxies.push(newProxy);
    res.json(newProxy);
  });

  app.get("/api/results", requireAuth, (req, res) => {
    // Only return results that belong to the user's tasks
    const userTaskIds = tasks.filter(t => t.userId === (req as any).user.id).map(t => t.id);
    res.json(results.filter(r => userTaskIds.includes(r.taskId)));
  });

  app.get("/api/results/export", requireAuth, (req, res) => {
    const { taskId } = req.query;
    const userTaskIds = tasks.filter(t => t.userId === (req as any).user.id).map(t => t.id);

    let csv = "ID,РўРёРї,Р—РЅР°С‡РµРЅРёРµ,Р—Р°РїСЂРѕСЃ (РљР»СЋС‡),РСЃС‚РѕС‡РЅРёРє,Р”Р°С‚Р°\\n";
    let exportResults = results.filter(r => userTaskIds.includes(r.taskId));
    
    if (taskId && taskId !== "all") {
        exportResults = exportResults.filter(r => r.taskId === taskId);
    }
    
    exportResults.forEach(r => {
      const task = tasks.find(t => t.id === r.taskId);
      const keyword = task ? task.keyword : "РќРµРёР·РІРµСЃС‚РЅРѕ";
      csv += `"${r.id}","${r.type}","${r.value}","${keyword}","${r.source}","${r.foundAt}"\n`;
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=results_${taskId !== "all" ? taskId : "all"}.csv`);
    res.send("\uFEFF" + csv); // Adding BOM for Excel Russian support
  });

  // Parser Logic
  async function runParser(taskId: string, keyword: string, engine: string, proxyId: string | undefined, limit: number, filters: string[], country: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const addLog = (msg: string) => {
      if (!task.logs) task.logs = [];
      task.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
      if (task.logs.length > 50) task.logs.pop();
    };

    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ];

    task.status = "starting";
    addLog("Starting Playwright extraction engine...");
    task.progress = 5;

    const proxy = proxies.find((p) => p.id === proxyId);
    
    let browser: any;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      addLog("Creating browser profile...");
      const context = await browser.newContext({
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();

      addLog(`Search [${country}] in ${engine}: ${keyword}`);
      
      let searchUrl = "";
      const countryParams: Record<string, string> = {
        ru: "&gl=ru&hl=ru",
        us: "&gl=us&hl=en",
        de: "&gl=de&hl=de",
        ua: "&gl=ua&hl=uk",
        kz: "&gl=kz&hl=ru"
      };

      if (engine === "google") {
        const geo = countryParams[country] || "";
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=100${geo}`;
      } else {
        const geo = country === "all" ? "" : `&kl=${country}-${country}`;
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(keyword)}${geo}`;
      }

      // РЎР»СѓС‡Р°Р№РЅР°СЏ Р·Р°РґРµСЂР¶РєР° РїРµСЂРµРґ Р·Р°РїСЂРѕСЃРѕРј
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
      let processedLinks = new Set<string>();
      let maxSearchLoops = 20;
      let currentSearchLoop = 0;
      
      const searchPage = page; // Use the already opened page
      
      task.progress = 10;
      
      while (task.resultsCount < limit && currentSearchLoop < maxSearchLoops) {
        currentSearchLoop++;
        let currentSearchUrl = searchUrl;
        
        if (engine === "google") {
           const offset = (currentSearchLoop - 1) * 100;
           currentSearchUrl = `${searchUrl}&start=${offset}`;
        }
        
        if (currentSearchLoop === 1) {
           await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45000 });
           const pageTitle = await searchPage.title();
           addLog(`Search page title: ${pageTitle}`);

           if (pageTitle.toLowerCase().includes("captcha") || pageTitle.toLowerCase().includes("robot") || pageTitle.toLowerCase().includes("security")) {
             addLog("Warning: anti-bot protection detected. Try another proxy or VLESS profile.");
           }
        } else if (engine === "google") {
           await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45000 });
        } else {
           // duckduckgo keeps endless scroll, just scroll more on the same page
        }

        if (engine === "duckduckgo" || engine === "google") {
          addLog("Scrolling search results...");
          for (let i = 0; i < 5; i++) {
            await searchPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        const content = await searchPage.content();
        const $ = cheerio.load(content);

        addLog(`Collecting links (${currentSearchLoop}/${maxSearchLoops})...`);

        const links: string[] = [];
        
        // РђРіСЂРµСЃСЃРёРІРЅС‹Р№ СЃР±РѕСЂ СЃСЃС‹Р»РѕРє РёР· РІС‹РґР°С‡Рё
        $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          
          let cleanUrl = href;
          
          // РћР±СЂР°Р±РѕС‚РєР° СЂРµРґРёСЂРµРєС‚РѕРІ Google (/url?q=...)
          if (href.includes("/url?q=")) {
            try {
              const searchParams = new URL(href, "https://google.com").searchParams;
              cleanUrl = searchParams.get("q") || href;
            } catch(e) {}
          }

          // Р¤РёР»СЊС‚СЂ РјСѓСЃРѕСЂР° Рё СЃРёСЃС‚РµРјРЅС‹С… СЃСЃС‹Р»РѕРє
          const isSystem = [
            "google.", "gstatic.", "duckduckgo.", "bing.", "yandex.", 
            "doubleclick.", "w3.org", "schema.org", "youtube.com", 
            "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
            "apple.com", "microsoft.com", "cloudflare.com", "support.google",
            "accounts.google", "maps.google"
          ].some(d => cleanUrl.toLowerCase().includes(d));

          if (cleanUrl.startsWith("http") && !isSystem) {
            // РЈР±РёСЂР°РµРј РїР°СЂР°РјРµС‚СЂС‹ РёР· URL РґР»СЏ С‡РёСЃС‚РѕС‚С‹
            try {
              const urlObj = new URL(cleanUrl);
              links.push(urlObj.origin + urlObj.pathname);
            } catch(e) {
              links.push(cleanUrl);
            }
          }
        });

        if (links.length === 0) {
          // РџСЂРѕР±СѓРµРј РёСЃРєР°С‚СЊ РїРѕ СѓРїСЂРѕС‰РµРЅРЅРѕРјСѓ СЃРµР»РµРєС‚РѕСЂСѓ, РµСЃР»Рё Р°РіСЂРµСЃСЃРёРІРЅС‹Р№ РЅРµ СЃСЂР°Р±РѕС‚Р°Р»
          $("h3").each((i, el) => {
              const parentA = $(el).closest('a').attr('href');
              if (parentA && parentA.startsWith('http')) links.push(parentA);
          });
        }
        
        const newLinks = Array.from(new Set(links)).filter(l => !processedLinks.has(l));
        
        if (newLinks.length === 0) {
          addLog("No fresh links on this page. Continuing...");
          if (engine === "duckduckgo" && currentSearchLoop >= 8) break; // If we keep scrolling DDG and get nothing, stop
          continue;
        }

        addLog(`Picked ${newLinks.length} fresh sites for extraction.`);
        newLinks.forEach(l => processedLinks.add(l));
        task.status = "running";

        // РџР°СЂР°Р»Р»РµР»СЊРЅР°СЏ РѕР±СЂР°Р±РѕС‚РєР° РїР°С‡РєР°РјРё (Pool size = 5)
        const CONCURRENCY = 5;
        for (let i = 0; i < newLinks.length; i += CONCURRENCY) {
          if (task.resultsCount >= limit) {
            addLog(`Contact limit reached (${limit}). Stopping navigation.`);
            break;
          }

          const batch = newLinks.slice(i, i + CONCURRENCY);
        
        await Promise.all(batch.map(async (link) => {
          let batchPage;
          try {
            batchPage = await context.newPage();
            // РћС‚РєР»СЋС‡Р°РµРј Р»РёС€РЅРёРµ СЂРµСЃСѓСЂСЃС‹ РґР»СЏ СЃРєРѕСЂРѕСЃС‚Рё
            await batchPage.route('**/*.{png,jpg,jpeg,svg,css,woff,woff2}', (route: any) => route.abort());
            
            addLog(`Opening: ${link.split('/')[2]}`);
            await batchPage.goto(link, { waitUntil: "domcontentloaded", timeout: 15000 });
            const pageHtml = await batchPage.content();
            
            const foundItems: {type: string, value: string}[] = [];

            // Email (Р‘РѕР»РµРµ С‚РѕС‡РЅС‹Р№ regex)
            if (filters.includes("email")) {
              const emails = pageHtml.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,6}/g) || [];
              emails.forEach((v: string) => {
                if (!v.includes('.png') && !v.includes('.jpg')) {
                  foundItems.push({type: "Email", value: v.toLowerCase()});
                }
              });
            }

            // Telegram (РЈР»СѓС‡С€РµРЅРЅС‹Р№)
            if (filters.includes("telegram")) {
              const tgLinks = pageHtml.match(/(?:t\.me|telegram\.me|tg:\/\/resolve\?domain=)([a-zA-Z0-9_]{5,})/gi) || [];
              tgLinks.forEach((v: string) => {
                const username = v.split('/').pop()?.replace('resolve?domain=', '');
                if (username) foundItems.push({type: "Telegram", value: `@${username}`});
              });
            }

            // WhatsApp (РЈР»СѓС‡С€РµРЅРЅС‹Р№)
            if (filters.includes("whatsapp")) {
              const wa = pageHtml.match(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=|whatsapp:)(\d{10,15})/g) || [];
              wa.forEach((v: string) => {
                const phone = v.match(/\d+/)?.[0];
                if (phone) foundItems.push({type: "WhatsApp", value: `+${phone}`});
              });
            }

            // Phones (International Support)
            if (filters.includes("phone")) {
              // РќР°С…РѕРґРёРј РЅРѕРјРµСЂР° СЂР°Р·РЅС‹С… СЃС‚СЂР°РЅ: +1 (USA), +49 (DE), +7 (RU/KZ) Рё С‚.Рґ.
              const intlPhones = pageHtml.match(/(?:\+|00)\d{1,3}[\s\-]?\(?\d{2,5}\)?[\s\-]?\d{3,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/g) || [];
              const ruPhones = pageHtml.match(/(?:\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g) || [];
              
              const allFound = [...intlPhones, ...ruPhones];
              
              allFound.forEach(v => {
                const cleaned = v.replace(/[^\d+]/g, '').replace(/^00/, '+');
                // Р’Р°Р»РёРґР°С†РёСЏ РґР»РёРЅС‹ РґР»СЏ РёСЃРєР»СЋС‡РµРЅРёСЏ РјСѓСЃРѕСЂР°
                if (cleaned.length >= 11 && cleaned.length <= 15) {
                  foundItems.push({type: "Phone", value: cleaned});
                } else if (cleaned.length === 10 && (country === 'us' || country === 'all')) {
                  foundItems.push({type: "Phone", value: cleaned}); // Local US
                }
              });
            }

            foundItems.forEach(item => {
              if (task.resultsCount >= limit) return; // РџСЂРѕРІРµСЂРєР° Р»РёРјРёС‚Р° РІРЅСѓС‚СЂРё СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ СЃР°Р№С‚Р°
              if (!results.find(r => r.taskId === taskId && r.value === item.value)) {
                results.push({
                  id: uuidv4(),
                  taskId,
                  type: item.type,
                  value: item.value,
                  source: link,
                  foundAt: new Date().toLocaleString("ru-RU")
                });
                task.resultsCount++;
                task.progress = Math.floor((task.resultsCount / limit) * 100);
                addLog(`Found [${item.type}]: ${item.value.slice(0, 28)}...`);
              }
            });

          } catch (e) {
            addLog(`Error [${link.split('/')[2]}]: ${String(e).slice(0, 80)}`);
          } finally {
            if (batchPage) await batchPage.close();
          }
        }));
      } // end of batch processing
      
      } // end of while loop (search loop)

      if (searchPage && !searchPage.isClosed()) await searchPage.close();
      await browser.close();
      task.status = "completed";
      addLog("Extraction completed.");
      task.progress = 100;
    } catch (error) {
      addLog(`Critical error: ${error}`);
      if (browser) await browser.close();
      task.status = "failed";
      task.error = String(error);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
