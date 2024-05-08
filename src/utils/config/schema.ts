import * as joi from "joi";

const builderSchema = joi.object().keys({
  type: joi.string().valid("app", "template", "h5", "web").default("app"),
  main: joi.string().required(),
});

const packageSchema = joi.object().keys({
  name: joi.string().required(),
  source: joi.string().required(),
  builder: joi.array().items(builderSchema).required(),
});

const commonSchema = joi.object().keys({
  name: joi.string().required(),
  source: joi.string().required(),
  main: joi.string().required(),
});

export default joi.object({
  package: joi.array().items(packageSchema).required(),
  common: joi.array().items(commonSchema),
});
