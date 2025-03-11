import mongoose from "mongoose";

const StickyMessagesSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    messageId: { type: String, required: true }
});

const StickyMessages = mongoose.model("StickyMessages", StickyMessagesSchema);
export default StickyMessages;
