import Joi from "joi";


export const validateRegisterInput =(data)=>{
const schema = Joi.object({
  name: Joi.string().max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
return schema.validate(data);
}


export const validateLoginInput =(data)=>{
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
return schema.validate(data);
}



