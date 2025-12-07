import jwt from "jsonwebtoken";
import HttpError from "../helpers/HttpError.js";
import User from "../db/models/user.js";

const { JWT_SECRET = "default_jwt_secret" } = process.env;

const authenticate = async (req, res, next) => {
  try {
    const { authorization = "" } = req.headers;
    const [bearer, token] = authorization.split(" ");

    if (bearer !== "Bearer" || !token) {
      return next(HttpError(401, "Not authorized"));
    }

    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(id);

    if (!user || user.token !== token) {
      return next(HttpError(401, "Not authorized"));
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    next(HttpError(401, "Not authorized"));
  }
};

export default authenticate;
