import Joi from "joi";


export const validateMediaInput =(data)=>{
const schema = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().required(),
  mediaUrls: Joi.string().required(),
});
return schema.validate(data);
}
