import test from "node:test";
import assert from "node:assert";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

let sequelize;
let Contact;
let controllers;
let User;
let container;

const initialContacts = [
  {
    name: "Alice",
    email: "alice@example.com",
    phone: "123-456-7890",
    favorite: false,
  },
  {
    name: "Bob",
    email: "bob@example.com",
    phone: "987-654-3210",
    favorite: true,
  },
];

let contact1Id;
let contact2Id;
let ownerId;

test.before(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();

  process.env.DB_NAME = container.getDatabase();
  process.env.DB_USER = container.getUsername();
  process.env.DB_PASSWORD = container.getPassword();
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getPort();

  ({ sequelize } = await import("./db/sequelize.js"));
  Contact = (await import("./db/models/contact.js")).default;
  User = (await import("./db/models/user.js")).default;
  controllers = await import("./controllers/contactsControllers.js");

  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

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
    if (err) {
      error = err;
    }
  };
  return { next, getError: () => error };
};

test.beforeEach(async () => {
  await Contact.destroy({ where: {} });
  await User.destroy({ where: {} });
  const owner = await User.create({
    email: "owner@example.com",
    password: "hashed",
  });
  ownerId = owner.id;
  const created = await Contact.bulkCreate(
    initialContacts.map((contact) => ({ ...contact, owner: ownerId })),
    {
      returning: true,
    },
  );
  contact1Id = created[0].id;
  contact2Id = created[1].id;
});

test.after(async () => {
  await sequelize?.close();
  await container?.stop();
});

test("getAllContacts controller sends 200 with list", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.getAllContacts(
    { user: { id: ownerId }, query: {} },
    res,
    next,
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.length, initialContacts.length);
  assert.strictEqual(getError(), null);
});

test("getOneContact controller sends contact or 404 error", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.getOneContact(
    { params: { id: contact1Id }, user: { id: ownerId } },
    res,
    next,
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.name, initialContacts[0].name);
  assert.strictEqual(getError(), null);

  const resMissing = createRes();
  const tracker = createNextTracker();
  await controllers.getOneContact(
    { params: { id: 999999 }, user: { id: ownerId } },
    resMissing,
    tracker.next,
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
  assert.strictEqual(err.message, "Not found");
});

test("deleteContact controller returns removed contact or 404", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.deleteContact(
    { params: { id: contact1Id }, user: { id: ownerId } },
    res,
    next,
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.id, contact1Id);
  assert.strictEqual(getError(), null);

  const tracker = createNextTracker();
  await controllers.deleteContact(
    { params: { id: 999999 }, user: { id: ownerId } },
    createRes(),
    tracker.next,
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
});

test("createContact controller adds contact and returns 201", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();
  const body = {
    name: "Dana",
    email: "dana@example.com",
    phone: "555-1234",
  };

  await controllers.createContact({ body, user: { id: ownerId } }, res, next);

  assert.strictEqual(res.statusCode, 201);
  assert.ok(res.payload.id);
  assert.strictEqual(res.payload.name, body.name);
  assert.strictEqual(getError(), null);
});

test("updateContact controller validates body presence", async () => {
  const res = createRes();
  const tracker = createNextTracker();

  await controllers.updateContact(
    { params: { id: contact1Id }, body: {}, user: { id: ownerId } },
    res,
    tracker.next,
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 400);
  assert.strictEqual(err.message, "Body must have at least one field");
});

test("updateContact controller updates contact or returns 404", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.updateContact(
    { params: { id: contact2Id }, body: { phone: "000-1111" }, user: { id: ownerId } },
    res,
    next,
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.phone, "000-1111");
  assert.strictEqual(res.payload.name, initialContacts[1].name);
  assert.strictEqual(getError(), null);

  const tracker = createNextTracker();
  await controllers.updateContact(
    { params: { id: 999999 }, body: { phone: "000-1111" }, user: { id: ownerId } },
    createRes(),
    tracker.next,
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
});

test("updateStatusContact controller updates favorite or returns 404", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.updateStatusContact(
    { params: { contactId: contact1Id }, body: { favorite: true }, user: { id: ownerId } },
    res,
    next,
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.favorite, true);
  assert.strictEqual(getError(), null);

  const tracker = createNextTracker();
  await controllers.updateStatusContact(
    { params: { contactId: 999999 }, body: { favorite: false }, user: { id: ownerId } },
    createRes(),
    tracker.next,
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
});
