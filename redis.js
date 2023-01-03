import redis from "ioredis";

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379
});

if (process.env.REDIS_PASSWORD) {
    redisClient.auth(process.env.REDIS_PASSWORD);
}

redisClient.on("error", (err) => {
    console.log("Connection error");
});

redisClient.on("connect", (err) => {
    console.log("Connected");
});

export { redisClient };