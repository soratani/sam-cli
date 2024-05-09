import * as joi from "joi";

const builderSchema = joi.object().keys({
  type: joi.string().valid("app", "template", "h5", "web").default("app"),
  template: joi.string().required(),
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
  main: joi.string()
});

export default joi.object({
  theme: joi.string(),
  public: joi.string(),
  package: joi.array().items(packageSchema).required(),
  common: joi.array().items(commonSchema),
});
