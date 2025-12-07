import Contact from "../db/models/contact.js";

const normalizeId = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

async function listContacts(ownerId, { page = 1, limit = 20, favorite } = {}) {
  const offset = (page - 1) * limit;
  const where = { owner: ownerId };
  if (favorite !== undefined) {
    where.favorite = favorite;
  }

  const contacts = await Contact.findAll({
    where,
    limit: limit,
    offset,
  });
  return contacts.map((contact) => contact.toJSON());
}

async function getContactById(contactId, ownerId) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findOne({
    where: { id, owner: ownerId },
  });
  return contact ? contact.toJSON() : null;
}

async function removeContact(contactId, ownerId) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findOne({
    where: { id, owner: ownerId },
  });

  if (!contact) {
    return null;
  }

  await contact.destroy();
  return contact.toJSON();
}

async function addContact(name, email, phone, favorite = false, owner) {
  const contact = await Contact.create({ name, email, phone, favorite, owner });
  return contact.toJSON();
}

async function updateContact(contactId, body, ownerId) {
  const id = normalizeId(contactId);
  if (id === null) return null;

  const contact = await Contact.findOne({
    where: { id, owner: ownerId },
  });

  if (!contact) {
    return null;
  }

  const updated = await contact.update(body);
  return updated.toJSON();
}

async function updateStatusContact(contactId, body, ownerId) {
  return updateContact(contactId, body, ownerId);
}

export {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
