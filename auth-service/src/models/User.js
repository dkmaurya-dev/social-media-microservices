import mongoose from "mongoose";
import argon2 from "argon2";
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // ✅ Mongoose will automatically add createdAt & updatedAt
  }
);



UserSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  try {
    const hashedPassword = await argon2.hash(user.password);
    user.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});
UserSchema.methods.comparePassword = async function (password) {
  const user = this;
  try {
    const isMatch = await argon2.verify(user.password, password);
    if (isMatch) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// UserSchema.methods.generateAuthToken = function () {
//   const user = this;
//   const timestamp = Date.now();
//   const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
//     expiresIn: "1h",
//   });
//   return token;
// };

// UserSchema.methods.toAuthJSON = function () {
//   const user = this;
//   const { _id, name, email, password } = user;
//   return {
//     _id,
//     name,
//     email,
//     password,
//   };
// };  

UserSchema.index({ name:"text"}, { unique: true });








export default mongoose.model("User", UserSchema);
