import HttpError from "../helpers/HttpError.js";
import {
  listContacts as listContactsService,
  getContactById as getContactByIdService,
  removeContact as removeContactService,
  addContact as addContactService,
  updateContact as updateContactService,
  updateStatusContact as updateStatusContactService,
} from "../services/contactsServices.js";

export const getAllContacts = async (req, res, next) => {
  try {
    const { id: owner } = req.user;
    const { page = 1, limit = 20, favorite } = req.query;
    const favoriteFilter =
      favorite === undefined ? undefined : favorite === "true";
    const contacts = await listContactsService(owner, {
      page,
      limit,
      favorite: favoriteFilter,
    });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
};

export const getOneContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: owner } = req.user;
    const contact = await getContactByIdService(id, owner);

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
    const { id: owner } = req.user;
    const removedContact = await removeContactService(id, owner);

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
    const { id: owner } = req.user;
    const newContact = await addContactService(
      name,
      email,
      phone,
      favorite,
      owner
    );

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
    const { id: owner } = req.user;
    const updatedContact = await updateContactService(id, req.body, owner);

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
    const { id: owner } = req.user;
    const updatedContact = await updateStatusContactService(
      contactId,
      req.body,
      owner
    );

    if (!updatedContact) {
      return next(HttpError(404, "Not found"));
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
};
