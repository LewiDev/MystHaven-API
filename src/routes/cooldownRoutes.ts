import { FastifyInstance } from "fastify";
import ChannelCooldown from "../models/ChannelCooldowns";

export default async function cooldownRoutes(fastify: FastifyInstance) {
    const { redis } = fastify;

    // ✅ Get cooldowns for a channel
    fastify.get("/cooldown/:channelId", async (request, reply) => {
        const { channelId } = request.params as { channelId: string };

        try {
            const cacheKey = `cooldown:channel:${channelId}`;
            const cachedCooldown = await redis.get(cacheKey);

            if (cachedCooldown) {
                return reply.send(JSON.parse(cachedCooldown));
            }

            const cooldown = await ChannelCooldown.findOne({ channelId });
            if (!cooldown) {
                return reply.send({ emojiActive: false, emojiExpiresAt: null, nameActive: false, nameExpiresAt: null });
            }

            const now = new Date();
            const emojiActive = cooldown.emojiExpiresAt && cooldown.emojiExpiresAt > now;
            const nameActive = cooldown.nameExpiresAt && cooldown.nameExpiresAt > now;

            const response = {
                emojiActive,  // ✅ Return boolean to make bot logic simpler
                emojiExpiresAt: cooldown.emojiExpiresAt,
                nameActive,
                nameExpiresAt: cooldown.nameExpiresAt
            };


            const ttl = Math.floor((cooldown.emojiExpiresAt.getTime() - Date.now()) / 1000);
            await redis.setex(cacheKey, ttl, JSON.stringify(response));
// Cache for 1 hour
            return reply.send(response);
        } catch (error) {
            console.error("❌ Error fetching cooldown:", error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });

    // ✅ Set cooldown for a specific type (emoji or name)
    fastify.post<{ Params: { channelId: string }, Body: { type: "emoji" | "name" } }>("/cooldown/:channelId", async (request, reply) => {
        const { channelId } = request.params;
        const { type } = request.body;
        const expiresAt = new Date(Date.now() + 3600000); // 1-hour cooldown

        try {
            const updateData = type === "emoji" ? { emojiExpiresAt: expiresAt } : { nameExpiresAt: expiresAt };
            
            const cooldown = await ChannelCooldown.findOneAndUpdate(
                { channelId },
                { $set: updateData },
                { new: true, upsert: true }
            );

            const cacheKey = `cooldown:channel:${channelId}`;
            const ttl = Math.floor((cooldown.emojiExpiresAt.getTime() - Date.now()) / 1000);
            await redis.setex(cacheKey, ttl, JSON.stringify(cooldown));


            return reply.send({ message: `✅ ${type} cooldown set successfully.`, expiresAt });
        } catch (error) {
            console.error(`❌ Error setting ${type} cooldown:`, error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });

    // ✅ Remove a specific cooldown
    fastify.delete<{ Params: { channelId: string }, Body: { type: "emoji" | "name" } }>("/cooldown/:channelId", async (request, reply) => {
        const { channelId } = request.params;
        const { type } = request.body;

        try {
            const updateData = type === "emoji" ? { emojiExpiresAt: null } : { nameExpiresAt: null };
            await ChannelCooldown.findOneAndUpdate({ channelId }, { $set: updateData });

            const cacheKey = `cooldown:channel:${channelId}`;
            await redis.del(cacheKey);

            return reply.send({ message: `✅ ${type} cooldown removed successfully.` });
        } catch (error) {
            console.error(`❌ Error deleting ${type} cooldown:`, error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });
}
