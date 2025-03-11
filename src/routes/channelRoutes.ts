import { FastifyInstance } from "fastify";
import Channel from "../models/Channels";

export default async function channelRoutes(fastify: FastifyInstance) {
    const { redis } = fastify;

    // ✅ GET Channel by userId or channelId
    fastify.get("/channel", async (request, reply) => {
        const { userId, channelId } = request.query as { userId?: string; channelId?: string };

        if (!userId && !channelId) {
            return reply.status(400).send({ message: "❌ Provide either userId or channelId." });
        }

        try {
            const cacheKey = userId ? `channel:user:${userId}` : `channel:id:${channelId}`;
            const cachedChannel = await redis.get(cacheKey);

            if (cachedChannel) {
                return reply.send(JSON.parse(cachedChannel));
            }

            const query = userId ? { userId } : { channelId };
            const channel = await Channel.findOne(query);

            if (!channel) return reply.status(404).send({ message: "❌ Channel not found." });

            await redis.setex(cacheKey, 3600, JSON.stringify(channel)); // Cache for 1 hour
            return reply.send(channel);
        } catch (error) {
            console.error("❌ Error fetching channel:", error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });

    // ✅ SET (Create or Update) Channel
    fastify.post<{ Body: { userId: string; channelId: string } }>("/channel", async (request, reply) => {
        const { userId, channelId } = request.body;

        if (!userId || !channelId) {
            return reply.status(400).send({ message: "❌ Both userId and channelId are required." });
        }

        try {
            const channel = await Channel.findOneAndUpdate(
                { userId },
                { channelId },
                { new: true, upsert: true }
            );

            const cacheKeyUser = `channel:user:${userId}`;
            const cacheKeyChannel = `channel:id:${channelId}`;
            await redis.setex(cacheKeyUser, 3600, JSON.stringify(channel));
            await redis.setex(cacheKeyChannel, 3600, JSON.stringify(channel));

            return reply.send({ message: "✅ Channel updated successfully.", channel });
        } catch (error) {
            console.error("❌ Error updating channel:", error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });

    // ✅ DELETE Channel by userId or channelId
    fastify.delete("/channel", async (request, reply) => {
        const { userId, channelId } = request.query as { userId?: string; channelId?: string };

        if (!userId && !channelId) {
            return reply.status(400).send({ message: "❌ Provide either userId or channelId." });
        }

        try {
            const query = userId ? { userId } : { channelId };
            const deletedChannel = await Channel.findOneAndDelete(query);

            if (!deletedChannel) return reply.status(404).send({ message: "❌ Channel not found." });

            const cacheKeyUser = userId ? `channel:user:${userId}` : null;
            const cacheKeyChannel = channelId ? `channel:id:${channelId}` : null;

            if (cacheKeyUser) await redis.del(cacheKeyUser);
            if (cacheKeyChannel) await redis.del(cacheKeyChannel);

            return reply.send({ message: "✅ Channel deleted successfully." });
        } catch (error) {
            console.error("❌ Error deleting channel:", error);
            return reply.status(500).send({ message: "⚠️ Server error." });
        }
    });
}
