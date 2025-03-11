import { FastifyInstance } from "fastify";
import BoostedArenaLists from "../models/BoostedArenaLists";

export default async function boostedArenaRoutes(fastify: FastifyInstance) {
    
    // GET Boosted Arena List by Guild ID (with Redis caching)
    fastify.get("/boosted-arena/:guildId", async (request, reply) => {
        const { guildId } = request.params as { guildId: string };

        try {
            // Check Redis cache first
            const cachedData = await fastify.redis.get(`boosted-arena:${guildId}`);
            if (cachedData) {
                return reply.send(JSON.parse(cachedData));
            }

            // Fetch from MongoDB if not cached
            const arenaList = await BoostedArenaLists.findOne({ guildId });
            if (!arenaList) {
                return reply.status(404).send({ message: "Boosted arena list not found" });
            }

            // Cache result for 10 minutes
            await fastify.redis.setex(`boosted-arena:${guildId}`, 600, JSON.stringify(arenaList));

            return reply.send(arenaList);
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // POST Create or Update Boosted Arena List
    fastify.post<{ Params: { guildId: string }, Body: { messageId: string; members: string[] } }>("/boosted-arena/:guildId", async (request, reply) => {
        const { guildId } = request.params;
        const { messageId, members } = request.body;

        try {
            const arenaList = await BoostedArenaLists.findOneAndUpdate(
                { guildId },
                { $set: { messageId, members } },
                { new: true, upsert: true }
            ).lean();

            // Update Redis cache
            await fastify.redis.setex(`boosted-arena:${guildId}`, 600, JSON.stringify(arenaList));

            return reply.send({ message: "Boosted arena list updated successfully", arenaList });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // DELETE Boosted Arena List
    fastify.delete("/boosted-arena/:guildId", async (request, reply) => {
        const { guildId } = request.params as { guildId: string };

        try {
            await BoostedArenaLists.deleteOne({ guildId });

            // Remove from Redis cache
            await fastify.redis.del(`boosted-arena:${guildId}`);

            return reply.send({ message: "Boosted arena list deleted successfully" });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });
}
