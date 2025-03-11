import mongoose from "mongoose";

const BoostedArenaListsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    messageId: { type: String, required: true },
    members: { type: [String], required: true }
});


const BoostedArenaLists = mongoose.model("BoostedArenaLists", BoostedArenaListsSchema);
export default BoostedArenaLists;