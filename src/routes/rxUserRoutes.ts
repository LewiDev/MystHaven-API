import { FastifyInstance } from "fastify";
import User, { UserType } from "../models/rxUser";

export default async function userRoutes(fastify: FastifyInstance) {
    
    // GET User Data with Redis Cache
    fastify.get("/rxuser/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            // Check if data is in Redis cache
            const cachedUser = await fastify.redis.get(`rxuser:${id}`);
            if (cachedUser) {
                return reply.send(JSON.parse(cachedUser));
            }

            // If not in cache, fetch from MongoDB
            const user = await User.findOne({ userId: id.toString() });

            if (!user) {
                return reply.status(404).send({ message: "User not found" });
            }

            // Cache the data in Redis for 10 minutes (600 seconds)
            await fastify.redis.setex(`rxuser:${id}`, 600, JSON.stringify(user));

            return reply.send(user);
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // POST to Update User Data and Refresh Cache
    fastify.post<{ Params: { id: string }, Body: Partial<UserType> }>("/rxuser/:id", async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;

        try {
            const user = await User.findOneAndUpdate(
                { userId: id.toString() },
                { $set: updateData },
                { new: true, upsert: true }
            ).lean();

            // Update the Redis cache
            await fastify.redis.setex(`rxuser:${id}`, 600, JSON.stringify(user));

            return reply.send({ message: "User updated successfully", user });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });
}
