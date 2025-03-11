import { FastifyInstance } from "fastify";
import StickyMessages from "../models/StickyMessages";

export default async function stickyMessagesRoutes(fastify: FastifyInstance) {
    // GET Sticky Message by Channel ID (with Redis caching)
    fastify.get("/sticky/:channelId", async (request, reply) => {
        const { channelId } = request.params as { channelId: string };

        try {
            // Check Redis cache first
            const cachedData = await fastify.redis.get(`sticky:${channelId}`);
            if (cachedData) {
                return reply.send(JSON.parse(cachedData));
            }

            // Fetch from MongoDB if not cached
            const stickyMessage = await StickyMessages.findOne({ channelId });
            if (!stickyMessage) {
                return reply.status(404).send({ message: "Sticky message not found" });
            }

            // Cache result for 10 minutes
            await fastify.redis.setex(`sticky:${channelId}`, 600, JSON.stringify(stickyMessage));

            return reply.send(stickyMessage);
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // POST Create or Update Sticky Message
    fastify.post<{ Params: { channelId: string }, Body: { messageId: string } }>("/sticky/:channelId", async (request, reply) => {
        const { channelId } = request.params;
        const { messageId } = request.body;

        try {
            const stickyMessage = await StickyMessages.findOneAndUpdate(
                { channelId },
                { $set: { messageId } },
                { new: true, upsert: true }
            ).lean();

            // Update Redis cache
            await fastify.redis.setex(`sticky:${channelId}`, 600, JSON.stringify(stickyMessage));

            return reply.send({ message: "Sticky message updated successfully", stickyMessage });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // DELETE Sticky Message
    fastify.delete("/sticky/:channelId", async (request, reply) => {
        const { channelId } = request.params as { channelId: string };

        try {
            await StickyMessages.deleteOne({ channelId });

            // Remove from Redis cache
            await fastify.redis.del(`sticky:${channelId}`);

            return reply.send({ message: "Sticky message deleted successfully" });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });
}
