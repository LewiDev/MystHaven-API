import mongoose, { InferSchemaType } from "mongoose";

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    mageRank: { type: Number, default: 0 },
    mageXp: { type: Number, default: 0 },
    mageRoleId: { type: String, default: "1268131583777439825" },
    knightRank: { type: Number, default: 0 },
    knightXp: { type: Number, default: 0 },
    knightRoleId: { type: String, default: "1268229387149643827" },
    living: { type: Boolean, required: true, default: false },
    sovereign: { type: Boolean, required: true, default: false },
    sovereignRank: { type: Number, default: 0 },
    sovereignRoleId: { type: String, default: "" },
    sovereignXp: { type: Number, default: 0 },
    sovereignQuestsCompleted: { type: Boolean, required: true, default: false },
}, { timestamps: true });

type UserType = InferSchemaType<typeof UserSchema>; // Auto-generated TypeScript type

const User = mongoose.model("rxUser", UserSchema);

export default User
export { UserType }; // Export inferred type
