import HttpError from "../helpers/HttpError.js";
import {
  listContacts as listContactsService,
  getContactById as getContactByIdService,
  removeContact as removeContactService,
  addContact as addContactService,
  updateContact as updateContactService,
  updateStatusContact as updateStatusContactService,
} from "../services/contactsServices.js";

export const getAllContacts = async (_, res, next) => {
  try {
    const contacts = await listContactsService();
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
};

export const getOneContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await getContactByIdService(id);

    if (!contact) {
      return next(HttpError(404, "Not found"));
    }

    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const removedContact = await removeContactService(id);

    if (!removedContact) {
      return next(HttpError(404, "Not found"));
    }

    res.status(200).json(removedContact);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, favorite } = req.body;
    const newContact = await addContactService(name, email, phone, favorite);

    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return next(HttpError(400, "Body must have at least one field"));
    }

    const { id } = req.params;
    const updatedContact = await updateContactService(id, req.body);

    if (!updatedContact) {
      return next(HttpError(404, "Not found"));
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
};

export const updateStatusContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const updatedContact = await updateStatusContactService(contactId, req.body);

    if (!updatedContact) {
      return next(HttpError(404, "Not found"));
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
};
