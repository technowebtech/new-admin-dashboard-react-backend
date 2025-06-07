const Joi = require("joi")

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    })

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(", ")
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        details: errorMessage,
      })
    }

    next()
  }
}

// Common validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(100).required(),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    }),
    query: Joi.object(),
    params: Joi.object(),
  }),

  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
    query: Joi.object(),
    params: Joi.object(),
  }),

  updateProfile: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50),
      phone: Joi.string().pattern(/^[0-9]{10,15}$/),
      bio: Joi.string().max(500),
    }),
    query: Joi.object(),
    params: Joi.object(),
  }),

  getUserById: Joi.object({
    body: Joi.object(),
    query: Joi.object(),
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  }),

  // Teacher schemas
  createTeacher: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^[0-9]{10,15}$/),
      subject: Joi.string().min(2).max(100).required(),
      experience: Joi.string().max(100),
      qualification: Joi.string().max(200),
    }),
    query: Joi.object(),
    params: Joi.object(),
  }),

  updateTeacher: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50),
      phone: Joi.string().pattern(/^[0-9]{10,15}$/),
      subject: Joi.string().min(2).max(100),
      experience: Joi.string().max(100),
      qualification: Joi.string().max(200),
    }),
    query: Joi.object(),
    params: Joi.object(),
  }),

  getTeacherById: Joi.object({
    body: Joi.object(),
    query: Joi.object(),
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  }),
}

module.exports = {
  validate,
  schemas,
}
