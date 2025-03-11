import { FastifyInstance } from "fastify";
import Giveaway, { GiveawayType } from "../models/Giveaway";
import { v4 as uuidv4 } from "uuid"; // For generating unique giveaway IDs

export default async function giveawayRoutes(fastify: FastifyInstance) {
    
    // ✅ Get Active Giveaways (Cached)
    fastify.get("/giveaways", async (request, reply) => {
        try {
            // Check Redis cache
            const cachedGiveaways = await fastify.redis.get("giveaways:active");
            if (cachedGiveaways) {
                return reply.send(JSON.parse(cachedGiveaways));
            }

            // Fetch from DB
            const giveaways = await Giveaway.find({ status: "active" }).lean();
            await fastify.redis.setex("giveaways:active", 600, JSON.stringify(giveaways)); // Cache for 10 mins

            return reply.send(giveaways);
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ Get Giveaway by ID (Cached)
    fastify.get<{ Params: { id: string } }>("/giveaway/:id", async (request, reply) => {
        const { id } = request.params;

        try {
            // Check cache
            const cachedGiveaway = await fastify.redis.get(`giveaway:${id}`);
            if (cachedGiveaway) {
                return reply.send(JSON.parse(cachedGiveaway));
            }

            // Fetch from DB
            const giveaway = await Giveaway.findOne({ giveawayId: id }).lean();
            if (!giveaway) {
                return reply.status(404).send({ message: "Giveaway not found" });
            }

            // Cache for 10 mins
            await fastify.redis.setex(`giveaway:${id}`, 600, JSON.stringify(giveaway));

            return reply.send(giveaway);
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ Create a Giveaway
    fastify.post<{ Body: Omit<GiveawayType, "giveawayId" | "participants" | "status" | "winner"> }>("/giveaway", async (request, reply) => {
        const { hostId, guildId, prize, requirements, allowedRoles, endDate } = request.body;

        try {
            const giveaway = await Giveaway.create({
                giveawayId: uuidv4(),
                hostId,
                guildId,
                prize,
                requirements,
                allowedRoles,
                endDate: new Date(endDate),
                participants: [],
                status: "active",
                winner: null
            });

            // Invalidate giveaway cache
            await fastify.redis.del("giveaways:active");

            return reply.send({ message: "Giveaway created successfully", giveaway });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ Join Giveaway
    fastify.post<{ Params: { id: string }, Body: { userId: string } }>("/giveaway/:id/join", async (request, reply) => {
        const { id } = request.params;
        const { userId } = request.body;

        try {
            const giveaway = await Giveaway.findOne({ giveawayId: id });
            if (!giveaway) return reply.status(404).send({ message: "Giveaway not found" });

            if (giveaway.participants.includes(userId)) {
                return reply.status(400).send({ message: "User already joined" });
            }

            giveaway.participants.push(userId);
            await giveaway.save();

            // Update Redis cache
            await fastify.redis.setex(`giveaway:${id}`, 600, JSON.stringify(giveaway));

            return reply.send({ message: "Joined giveaway successfully" });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ Leave Giveaway
    fastify.post<{ Params: { id: string }, Body: { userId: string } }>("/giveaway/:id/leave", async (request, reply) => {
        const { id } = request.params;
        const { userId } = request.body;

        try {
            const giveaway = await Giveaway.findOne({ giveawayId: id });
            if (!giveaway) return reply.status(404).send({ message: "Giveaway not found" });

            giveaway.participants = giveaway.participants.filter(uid => uid !== userId);
            await giveaway.save();

            // Update Redis cache
            await fastify.redis.setex(`giveaway:${id}`, 600, JSON.stringify(giveaway));

            return reply.send({ message: "Left giveaway successfully" });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ End Giveaway (Pick Winner)
    fastify.post<{ Params: { id: string } }>("/giveaway/:id/end", async (request, reply) => {
        const { id } = request.params;

        try {
            const giveaway = await Giveaway.findOne({ giveawayId: id });
            if (!giveaway) return reply.status(404).send({ message: "Giveaway not found" });

            if (giveaway.status === "ended") {
                return reply.status(400).send({ message: "Giveaway already ended" });
            }

            if (giveaway.participants.length === 0) {
                giveaway.status = "ended";
                await giveaway.save();
                return reply.send({ message: "Giveaway ended with no participants" });
            }

            // Pick random winner
            const winner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
            giveaway.winner = winner;
            giveaway.status = "ended";
            await giveaway.save();

            // Update Redis
            await fastify.redis.del(`giveaway:${id}`);
            await fastify.redis.del("giveaways:active");

            return reply.send({ message: "Giveaway ended", winner });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });

    // ✅ Reroll Giveaway Winner
    fastify.post<{ Params: { id: string } }>("/giveaway/:id/reroll", async (request, reply) => {
        const { id } = request.params;

        try {
            const giveaway = await Giveaway.findOne({ giveawayId: id });
            if (!giveaway) return reply.status(404).send({ message: "Giveaway not found" });

            if (giveaway.status !== "ended" || giveaway.participants.length < 2) {
                return reply.status(400).send({ message: "Cannot reroll. Not enough participants or giveaway is still active" });
            }

            // Remove the last winner
            giveaway.participants = giveaway.participants.filter(uid => uid !== giveaway.winner);

            // Pick a new winner
            const newWinner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
            giveaway.winner = newWinner;
            await giveaway.save();

            return reply.send({ message: "Giveaway rerolled", newWinner });
        } catch (err) {
            reply.status(500).send({ message: "Server error" });
        }
    });
}
