import mongoose from "mongoose";

const ChannelCooldownSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    emojiExpiresAt: { type: Date, default: null },
    nameExpiresAt: { type: Date, default: null }
});

const ChannelCooldown = mongoose.model("ChannelCooldown", ChannelCooldownSchema);
export default ChannelCooldown;
