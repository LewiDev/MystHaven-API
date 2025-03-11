import mongoose, { InferSchemaType }  from "mongoose";

const ChannelSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true, unique: true},
}, { timestamps: true });

type ChannelType = InferSchemaType<typeof ChannelSchema>; // Auto-generated TypeScript type

const Channel = mongoose.model("channels", ChannelSchema);
export default Channel;
export { ChannelType };
