import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const contactsPath = process.env.CONTACTS_PATH
    ? path.resolve(process.env.CONTACTS_PATH)
    : path.resolve("db", "contacts.json");

async function readContacts() {
    const data = await fs.readFile(contactsPath, "utf-8");
    return JSON.parse(data);
}

async function writeContacts(contacts) {
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
}

async function listContacts() {
    return readContacts();
}

async function getContactById(contactId) {
    const contacts = await readContacts();
    return contacts.find(({ id }) => id === contactId) ?? null;
}

async function removeContact(contactId) {
    const contacts = await readContacts();
    const index = contacts.findIndex(({ id }) => id === contactId);

    if (index === -1) {
        return null;
    }

    const [removedContact] = contacts.splice(index, 1);
    await writeContacts(contacts);
    return removedContact;
}

async function addContact(name, email, phone) {
    const contacts = await readContacts();
    const newContact = { id: nanoid(), name, email, phone };

    contacts.push(newContact);
    await writeContacts(contacts);

    return newContact;
}

export { listContacts, getContactById, removeContact, addContact };
