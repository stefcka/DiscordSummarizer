import { Client, GatewayIntentBits } from "discord.js";

// Create Discord bot client (gateway connection)
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Store guilds in memory
let guildCache: any[] = [];

/**
 * Starts the bot and connects to Discord gateway
 */
export async function startBot(token: string): Promise<any[]> {
  return new Promise((resolve, reject) => {

    // When bot is ready
    client.once("ready", () => {
      console.log(`Logged in as ${client.user?.tag}`);

      // Cache all guilds the bot is in
      guildCache = client.guilds.cache.map((guild) => ({
        id: guild.id,
        name: guild.name,
      }));

      resolve(guildCache);
    });

    client.login(token).catch(reject);
  });
}

/**
 * Returns cached guilds
 */
export function getGuilds() {
  return guildCache;
}