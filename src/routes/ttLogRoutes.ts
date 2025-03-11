import { FastifyInstance } from "fastify";

export default async function ttLogRoutes(fastify: FastifyInstance) {
    // Ensure Redis is connected
    if (!fastify.redis) {
        throw new Error("Redis is not available in Fastify");
    }

    // ✅ Get userId from username
    fastify.get("/ttLog/:username", async (request, reply) => {
        const { username } = request.params as { username: string };

        const userId = await fastify.redis.get(`ttLog:${username}`);
        if (!userId) {
            return reply.status(404).send({ error: "User not found in ttLog" });
        }

        return { username, userId };
    });

    // ✅ Set ttLog entry (username -> userId)
    fastify.post("/ttLog", async (request, reply) => {
        const { username, userId } = request.body as { username: string, userId: string };

        if (!username || !userId) {
            return reply.status(400).send({ error: "username and userId are required" });
        }

        await fastify.redis.set(`ttLog:${username}`, userId);
        return { message: "ttLog entry set", username, userId };
    });

    // ✅ Delete ttLog entry
    fastify.delete("/ttLog/:username", async (request, reply) => {
        const { username } = request.params as { username: string };

        const deleted = await fastify.redis.del(`ttLog:${username}`);
        if (!deleted) {
            return reply.status(404).send({ error: "User not found in ttLog" });
        }

        return { message: "ttLog entry deleted", username };
    });
}
