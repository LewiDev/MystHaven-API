# Mysthaven API

This repository contains the **Mysthaven API**, a backend service designed to support **MystTools** and, in the future, **Rank Examiner**. It provides efficient data management for various bot functionalities, such as giveaways, channel cooldowns, and boosted arena lists.

## Features
- **Fastify-based API** for high-performance handling of requests
- **MongoDB with Mongoose** for data persistence
- **Redis caching** to optimize frequently accessed data
- **Endpoints for managing giveaways, cooldowns, and other bot-related data**

## Project Structure
```
MysthavenAPI/
├── src/
│   ├── index.ts                # API entry point
│   ├── models/
│   │   ├── BoostedArenaLists.ts  # Model for boosted arena lists
│   │   ├── ChannelCooldowns.ts   # Model for tracking channel cooldowns
│   │   ├── Channels.ts           # Model for channel-related data
│   │   ├── Giveaway.ts           # Model for giveaways
│   ├── routes/
│   │   ├── giveawayRoutes.ts     # Giveaway-related API endpoints
│   │   ├── channelRoutes.ts      # Channel data endpoints
│   │   ├── cooldownRoutes.ts     # Cooldown management endpoints
│   ├── utils/
│   │   ├── redisClient.ts        # Redis caching utility
│   │   ├── database.ts           # MongoDB connection handler
│   ├── ...
```

## API Endpoints
### Giveaway Management
- `GET /giveaway/:id` - Retrieve a giveaway by ID
- `POST /giveaway` - Create a new giveaway
- `DELETE /giveaway/:id` - Delete a giveaway

### Channel Cooldowns
- `GET /cooldown/:channelId` - Get cooldowns for a specific channel
- `POST /cooldown` - Set a cooldown for a channel

### Boosted Arena Lists
- `GET /boostedarenas` - Retrieve all boosted arenas
- `POST /boostedarenas` - Add a new boosted arena

## Why This API Exists
- Originally developed for **MystTools**, the API centralizes data access and improves bot performance.
- **Rank Examiner** will eventually use this API, allowing better integration between bots.
- Optimized handling of persistent data, reducing database strain on Discord bots.

## Future Plans
- **Extend support for Rank Examiner**
- **Enhance API security and rate limiting**
- **Expand Redis caching strategies**
- **Implement logging and monitoring tools**

## About Me
I am a backend developer specializing in API development, Discord bots, and database optimization. This project is part of my portfolio to showcase my technical skills in building scalable backend services.

## License
This project is archived for portfolio reference only.

