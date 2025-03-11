import mongoose, { InferSchemaType }  from "mongoose";

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    rpgMessages: { type: Number, default: 0 },
}, { timestamps: true });

type UserType = InferSchemaType<typeof UserSchema>; // Auto-generated TypeScript type

const User = mongoose.model("mtUser", UserSchema);

export default User
export { UserType };
