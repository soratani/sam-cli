import * as joi from "joi";

const proxySchema = joi.object().keys({
  path: joi.string().required(),
  target: joi.string().required(),
});

const appSchema = joi.object().keys({
  name: joi.string().required(),
  proxy: joi.array().items(proxySchema),
  environment: joi.string(),
  builder: joi.array().items(joi.string().valid("app", "template", "h5", "web").default("app")).required(),
});

export default joi.object({
  theme: joi.string(),
  public: joi.string(),
  apps: joi.array().items(appSchema).required(),
  packages: joi.array().items(joi.string()),
});
