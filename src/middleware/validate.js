import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';


export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new ApiError(400, errors[0].message, errors));
    }

    req[source] = result.data; 
    next();
  };

export const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ApiError(400, `Invalid product id: ${req.params.id}`));
  }
  next();
};