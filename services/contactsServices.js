import Contact from "../db/models/contact.js";

const normalizeId = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

async function listContacts() {
  const contacts = await Contact.findAll();
  return contacts.map((contact) => contact.toJSON());
}

async function getContactById(contactId) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findByPk(id);
  return contact ? contact.toJSON() : null;
}

async function removeContact(contactId) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findByPk(id);

  if (!contact) {
    return null;
  }

  await contact.destroy();
  return contact.toJSON();
}

async function addContact(name, email, phone, favorite = false) {
  const contact = await Contact.create({ name, email, phone, favorite });
  return contact.toJSON();
}

async function updateContact(contactId, body) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findByPk(id);

  if (!contact) {
    return null;
  }

  const updated = await contact.update(body);
  return updated.toJSON();
}

async function updateStatusContact(contactId, body) {
  return updateContact(contactId, body);
}

export {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
