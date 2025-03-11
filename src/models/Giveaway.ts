import mongoose, { InferSchemaType } from "mongoose";

const GiveawaySchema = new mongoose.Schema({
    giveawayId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    guildId: { type: String, required: true },
    prize: { type: String, required: true },
    requirements: { type: String, default: "" },
    allowedRoles: { type: [String], default: [] },
    participants: { type: [String], default: [] },
    endDate: { type: Date, required: true },
    winner: { type: String, default: null },
    status: { type: String, enum: ["active", "ended"], default: "active" },
}, { timestamps: true });

type GiveawayType = InferSchemaType<typeof GiveawaySchema>; 
const Giveaway = mongoose.model("giveaway", GiveawaySchema);
export default Giveaway;
export { GiveawayType };
