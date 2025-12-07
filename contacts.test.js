import test from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const initialContacts = [
  {
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    phone: "123-456-7890",
  },
  {
    id: "2",
    name: "Bob",
    email: "bob@example.com",
    phone: "987-654-3210",
  },
];

let contactsFile;
let controllers;

const writeFixture = () =>
  fs.writeFile(contactsFile, JSON.stringify(initialContacts, null, 2));

const readContactsFile = async () =>
  JSON.parse(await fs.readFile(contactsFile, "utf-8"));

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

test.before(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "contacts-"));
  contactsFile = path.join(dir, "contacts.json");
  process.env.CONTACTS_PATH = contactsFile;
  await writeFixture();

  controllers = await import("./controllers/contactsControllers.js");
});

test.beforeEach(async () => {
  await writeFixture();
});

test("getAllContacts controller sends 200 with list", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.getAllContacts({}, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.payload, initialContacts);
  assert.strictEqual(getError(), null);
});

test("getOneContact controller sends contact or 404 error", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.getOneContact({ params: { id: "1" } }, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.payload, initialContacts[0]);
  assert.strictEqual(getError(), null);

  const resMissing = createRes();
  const tracker = createNextTracker();
  await controllers.getOneContact(
    { params: { id: "missing" } },
    resMissing,
    tracker.next
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
  assert.strictEqual(err.message, "Not found");
});

test("deleteContact controller returns removed contact or 404", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.deleteContact({ params: { id: "1" } }, res, next);

  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.payload, initialContacts[0]);
  assert.strictEqual(getError(), null);

  const tracker = createNextTracker();
  await controllers.deleteContact(
    { params: { id: "missing" } },
    createRes(),
    tracker.next
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

  await controllers.createContact({ body }, res, next);

  assert.strictEqual(res.statusCode, 201);
  assert.ok(res.payload.id);
  assert.strictEqual(res.payload.name, body.name);
  assert.strictEqual(getError(), null);

  const fileData = await readContactsFile();
  assert.ok(fileData.find(({ id }) => id === res.payload.id));
});

test("updateContact controller validates body presence", async () => {
  const res = createRes();
  const tracker = createNextTracker();

  await controllers.updateContact({ params: { id: "1" }, body: {} }, res, tracker.next);

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 400);
  assert.strictEqual(err.message, "Body must have at least one field");
});

test("updateContact controller updates contact or returns 404", async () => {
  const res = createRes();
  const { next, getError } = createNextTracker();

  await controllers.updateContact(
    { params: { id: "2" }, body: { phone: "000-1111" } },
    res,
    next
  );

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.payload.phone, "000-1111");
  assert.strictEqual(res.payload.name, initialContacts[1].name);
  assert.strictEqual(getError(), null);

  const tracker = createNextTracker();
  await controllers.updateContact(
    { params: { id: "missing" }, body: { phone: "000-1111" } },
    createRes(),
    tracker.next
  );

  const err = tracker.getError();
  assert.ok(err);
  assert.strictEqual(err.status, 404);
});
