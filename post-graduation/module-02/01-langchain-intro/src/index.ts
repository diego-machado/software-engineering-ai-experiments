import { createServer } from "./server.ts";

const app = createServer();

await app.listen({ port: 4001, host: "0.0.0.0" });
console.log("server running at 4001");

// curl localhost:3000/chat --data '{"question": "uppercase this"}' -H "Content-type: application/json"
