import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

let sequelize;
let User;
let controllers;
let container;
const avatarsDir = path.resolve("public", "avatars");
const tempDir = path.resolve("temp");

const createRes = () => {
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
  return res;
};

const createNextTracker = () => {
  let error = null;
  const next = (err) => {
    if (err) error = err;
  };
  return { next, getError: () => error };
};

const cleanupAvatars = async () => {
  try {
    const files = await fs.readdir(avatarsDir);
    await Promise.all(
      files.map((file) =>
        file === "sample.png"
          ? null
          : fs.unlink(path.join(avatarsDir, file))
      )
    );
  } catch {
    /* ignore */
  }
};

before(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();

  await fs.mkdir(avatarsDir, { recursive: true });
  await fs.mkdir(tempDir, { recursive: true });

  process.env.DB_NAME = container.getDatabase();
  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort();
  process.env.JWT_SECRET = "testsecret";

  ({ sequelize } = await import("./db/sequelize.js"));
  User = (await import("./db/models/user.js")).default;
  controllers = await import("./controllers/authControllers.js");

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ where: {} });
  await cleanupAvatars();
});

after(async () => {
  await sequelize?.close();
  await container?.stop();
});

test("register creates user with gravatar and hashed password", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.register(
    { body: { email: "new@example.com", password: "secret123" } },
    res,
    next
  );

  assert.equal(res.statusCode, 201);
  assert.ok(res.payload.user.avatarURL.includes("gravatar"));
  assert.equal(getError(), null);

  const user = await User.findOne({ where: { email: "new@example.com" } });
  assert.ok(user);
  assert.notEqual(user.password, "secret123");
});

test("register returns conflict on duplicate email", async () => {
  await User.create({
    email: "dup@example.com",
    password: await bcrypt.hash("pass123", 10),
  });

  const { next, getError } = createNextTracker();
  await controllers.register(
    { body: { email: "dup@example.com", password: "pass123" } },
    createRes(),
    next
  );

  const err = getError();
  assert.ok(err);
  assert.equal(err.status, 409);
});

test("login returns token on success", async () => {
  const password = await bcrypt.hash("secret123", 10);
  await User.create({ email: "login@example.com", password });

  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.login(
    { body: { email: "login@example.com", password: "secret123" } },
    res,
    next
  );

  assert.equal(res.statusCode, 200);
  assert.ok(res.payload.token);
  assert.equal(getError(), null);
});

test("login fails with wrong password", async () => {
  const password = await bcrypt.hash("secret123", 10);
  await User.create({ email: "login-fail@example.com", password });

  const { next, getError } = createNextTracker();

  await controllers.login(
    { body: { email: "login-fail@example.com", password: "badpass" } },
    createRes(),
    next
  );

  const err = getError();
  assert.ok(err);
  assert.equal(err.status, 401);
});

test("logout clears token", async () => {
  const user = await User.create({
    email: "logout@example.com",
    password: "hashed",
    token: "tok",
  });

  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.logout({ user: { id: user.id } }, res, next);

  assert.equal(res.statusCode, 204);
  assert.equal(getError(), null);

  const updated = await User.findByPk(user.id);
  assert.equal(updated.token, null);
});

test("getCurrent returns user data", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.getCurrent(
    { user: { email: "me@example.com", subscription: "starter" } },
    res,
    next
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.email, "me@example.com");
  assert.equal(getError(), null);
});

test("updateSubscription updates subscription", async () => {
  const user = await User.create({
    email: "sub@example.com",
    password: "hashed",
    subscription: "starter",
  });

  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.updateSubscription(
    { user: { id: user.id }, body: { subscription: "pro" } },
    res,
    next
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.subscription, "pro");
  assert.equal(getError(), null);
});

test("updateAvatar stores file and updates avatarURL", async () => {
  const user = await User.create({
    email: "avatar@example.com",
    password: "hashed",
  });

  const tempFile = path.join(tempDir, "temp-avatar.png");
  await fs.writeFile(tempFile, Buffer.from([0, 1, 2, 3]));

  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.updateAvatar(
    {
      user: { id: user.id },
      file: { path: tempFile, originalname: "avatar.png" },
    },
    res,
    next
  );

  assert.equal(res.statusCode, 200);
  assert.ok(res.payload.avatarURL.startsWith("/avatars/"));
  assert.equal(getError(), null);

  const storedPath = path.join(avatarsDir, path.basename(res.payload.avatarURL));
  const exists = await fs
    .stat(storedPath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists);
});
