import Joi from "joi";


export const validatePostInput =(data)=>{
const schema = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().required(),
  mediaIds: Joi.array().items(Joi.string()).required(),
});
return schema.validate(data);
}
