import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "contacts-"));
const contactsFile = path.join(tempDir, "contacts.json");

const initialContacts = [
    {
        id: "existing-1",
        name: "Alice",
        email: "alice@example.com",
        phone: "123-45-67",
    },
    {
        id: "existing-2",
        name: "Bob",
        email: "bob@example.com",
        phone: "987-65-43",
    },
];

await fs.writeFile(contactsFile, JSON.stringify(initialContacts, null, 2));
process.env.CONTACTS_PATH = contactsFile;

const { listContacts, getContactById, addContact, removeContact } = await import(
    "./contactsServices.js"
);

beforeEach(async () => {
    await fs.writeFile(contactsFile, JSON.stringify(initialContacts, null, 2));
});

after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
});

test("listContacts returns all contacts", async () => {
    const contacts = await listContacts();
    assert.deepEqual(contacts, initialContacts);
});

test("getContactById returns contact or null", async () => {
    const contact = await getContactById("existing-1");
    assert.equal(contact?.name, "Alice");
    assert.equal(await getContactById("missing"), null);
});

test("addContact adds and persists new contact", async () => {
    const created = await addContact("Mango", "mango@example.com", "111-22-33");
    assert.equal(created.name, "Mango");
    assert.equal(created.email, "mango@example.com");
    assert.equal(created.phone, "111-22-33");
    assert.ok(created.id);

    const contacts = await listContacts();
    assert.equal(contacts.length, initialContacts.length + 1);
    assert.ok(contacts.some(({ id }) => id === created.id));
});

test("removeContact removes contact and returns removed item", async () => {
    const removed = await removeContact("existing-2");
    assert.equal(removed?.id, "existing-2");

    const contacts = await listContacts();
    assert.equal(contacts.length, initialContacts.length - 1);
    assert.ok(!contacts.some(({ id }) => id === "existing-2"));
});

test("removeContact returns null when id missing", async () => {
    const removed = await removeContact("missing");
    assert.equal(removed, null);
    const contacts = await listContacts();
    assert.equal(contacts.length, initialContacts.length);
});
