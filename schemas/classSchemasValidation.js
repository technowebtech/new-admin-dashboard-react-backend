const Joi = require('joi');

const allowedKeys = ['id', 'school_id', 'class_name', 'sort_name', 'other_name', 'cps_class_name'];

const classSchemasValidation = {
  searchByKey: Joi.object({
    key: Joi.string()
      .valid(...allowedKeys)
      .required(),
    value: Joi.string().required()
  })
};

module.exports = classSchemasValidation;
