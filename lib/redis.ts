import { createClient } from "redis"

export const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", function(err) {
  console.error('Redis client error:', err);
});
await client.connect()
