import Fastify from "fastify";
import mongoose from "mongoose";
import fastifyRedis from "fastify-redis";
import rxUserRoutes from "./routes/rxUserRoutes";
import stickyMessagesRoutes from "./routes/stickyMessagesRoutes"
import mtUserRoutes from "./routes/mtUserRoutes";
import boostedArenaRoutes from "./routes/boostedArenaListsRoutes";
import channelRoutes from "./routes/channelRoutes";
import cooldownRoutes from "./routes/cooldownRoutes";
import rxUser from "./models/rxUser";
import channels from "./models/Channels";
import ttLogRoutes from "./routes/ttLogRoutes";


const fastify = Fastify({ logger: true });

fastify.register(fastifyRedis, { host: "127.0.0.1", port: 6379 });

const startServer = async () => {
  try {
        await mongoose.connect("", {
          dbName: "Mysthaven",
        });

        // Read the JSON data
        //const jsonData = JSON.parse(``);

        //async function migrateFromJSON() {
        //    console.log("🚀 Starting migration from JSON...");
        //
        //    try {
        //        for (const user of jsonData) {
        //            if(user.userId === "590575157718941708") continue;
        //           // Prepare new user data
        //            const newUserData = {
        //                userId: user.userId,
        //                mageRank: user.mageRank,
        //                mageXp: user.mageXp,
        //                mageRoleId: user.mageRoleId,
        //                knightRank: user.knightRank,
        //                knightXp: user.knightXp,
        //                knightRoleId: user.knightRoleId,
        //                living: user.living,
        //                sovereign: user.sovereign,
        //                sovereignRank: user.sovereignRank,
        //                sovereignRoleId: user.sovereignRoleId,
        //                sovereignXp: user.sovereignXp,
        //                sovereignQuestsCompleted: user.sovereignQuestsCompleted,
        //            };
        //
        //            // Insert user data into the new user database
        //            await rxUser.create(newUserData);
        //            console.log(`✅ Migrated user ${user.userId}`);
        //
        //            // If the user has a channel, migrate it separately
        //            if (user.channel && user.channelId) {
        //              if(user.userId === "590575157718941708") continue;
        //                const channelData = {
        //                    userId: user.userId,
        //                    channelId: user.channelId,
        //                };
        //
        //                await channels.create(channelData);
        //                console.log(`✅ Migrated channel for user ${user.userId}`);
        //            }
        //        }
        //
        //        console.log("🎉 Migration complete!");
        //    } catch (error) {
        //        console.error("❌ Migration failed:", error);
        //    } finally {
        //        // Close connections
        //        console.log("🚪 Closing connections...");
        //    }
        //} 

        //migrateFromJSON();

       
        
        fastify.register(ttLogRoutes);
        fastify.register(rxUserRoutes);
        fastify.register(mtUserRoutes);
        fastify.register(stickyMessagesRoutes);
        fastify.register(boostedArenaRoutes);
        fastify.register(cooldownRoutes);
        fastify.register(channelRoutes);

        await fastify.listen({ port: Number(3001), host: "0.0.0.0" });
        console.log("🚀 Server running on port", 3001);
      } catch (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    };

startServer();


