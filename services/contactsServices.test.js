import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

let sequelize;
let Contact;
let services;
let container;

const initialContacts = [
    {
        name: "Alice",
        email: "alice@example.com",
        phone: "123-45-67",
        favorite: false,
    },
    {
        name: "Bob",
        email: "bob@example.com",
        phone: "987-65-43",
        favorite: true,
    },
];

let contact1Id;
let contact2Id;

before(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();

    process.env.DB_NAME = container.getDatabase();
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASSWORD = container.getPassword();
    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = container.getPort();

    ({ sequelize } = await import("../db/sequelize.js"));
    Contact = (await import("../db/models/contact.js")).default;
    services = await import("./contactsServices.js");

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
});

beforeEach(async () => {
    await Contact.destroy({ where: {} });
    const created = await Contact.bulkCreate(initialContacts, {
        returning: true,
    });
    contact1Id = created[0].id;
    contact2Id = created[1].id;
});

after(async () => {
    await sequelize?.close();
    await container?.stop();
});

test("listContacts returns all contacts", async () => {
    const contacts = await services.listContacts();
    assert.equal(contacts.length, initialContacts.length);
    assert.equal(contacts[0].name, initialContacts[0].name);
});

test("getContactById returns contact or null", async () => {
    const contact = await services.getContactById(contact1Id);
    assert.equal(contact?.name, "Alice");
    assert.equal(await services.getContactById(999999), null);
});

test("addContact creates contact with optional favorite", async () => {
    const created = await services.addContact(
        "Mango",
        "mango@example.com",
        "111-22-33",
    );
    assert.equal(created.name, "Mango");
    assert.equal(created.favorite, false);

    const createdFav = await services.addContact(
        "Kiwi",
        "kiwi@example.com",
        "000-00-00",
        true,
    );
    assert.equal(createdFav.favorite, true);
});

test("removeContact removes contact and returns removed item", async () => {
    const removed = await services.removeContact(contact2Id);
    assert.equal(removed?.id, contact2Id);

    const contacts = await services.listContacts();
    assert.equal(contacts.length, initialContacts.length - 1);
    assert.ok(!contacts.some(({ id }) => id === contact2Id));
});

test("updateContact merges fields", async () => {
    const updated = await services.updateContact(contact1Id, {
        email: "new@example.com",
    });
    assert.equal(updated?.email, "new@example.com");
});

test("updateStatusContact updates favorite flag", async () => {
    const updated = await services.updateStatusContact(contact1Id, {
        favorite: true,
    });
    assert.equal(updated?.favorite, true);
});
