const AppError = require('../utils/AppError');

/**
 * Zod validation middleware
 * Parses req[source] with the given zod schema.
 * On success, replaces req[source] with the parsed (cleaned) data.
 * On failure, throws AppError.badRequest with field-level details.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fieldErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw AppError.badRequest('Validation failed', fieldErrors);
    }

    // Replace with parsed (cleaned/coerced) data
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
