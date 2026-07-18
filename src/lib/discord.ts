import { invoke } from "@tauri-apps/api/core";
import type { DiscordMessage } from "./types";

export interface DiscordGuild {
  id: string;
  name: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

// ==============================
// FETCH GUILDS (BOT SERVERS)
// ==============================
export async function fetchGuilds(botToken: string): Promise<DiscordGuild[]> {
  try {
    const guilds = await invoke<DiscordGuild[]>("discord_fetch_guilds", {
      botToken,
    });
    return guilds;
  } catch (error) {
    console.error("Guild fetch error:", error);
    throw error;
  }
}

// ==============================
// FETCH CHANNELS (FROM GUILD)
// ==============================
export async function fetchChannels(
  guildId: string,
  botToken: string
): Promise<DiscordChannel[]> {
  try {
    const channels = await invoke<DiscordChannel[]>("discord_fetch_channels", {
      guildId,
      botToken,
    });
    return channels;
  } catch (error) {
    console.error("Channel fetch error:", error);
    throw error;
  }
}

// ==============================
// FETCH MESSAGES (with date filter)
// ==============================
export async function fetchMessages(
  channelId: string,
  botToken: string,
  startDate: Date,
  endDate: Date
): Promise<DiscordMessage[]> {
  try {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    const messages = await invoke<DiscordMessage[]>("discord_fetch_messages", {
      channelId,
      botToken,
      startDateMs: startMs,
      endDateMs: endMs,
    });

    return messages;
  } catch (error) {
    console.error("Discord fetch error:", error);
    throw error;
  }
}

// ==============================
// SEND MESSAGE TO DISCORD
// ==============================
export async function sendMessageToChannel(
  channelId: string,
  botToken: string,
  content: string
): Promise<string> {
  try {
    const messageId = await invoke<string>("discord_send_message", {
      channelId,
      botToken,
      content,
    });
    return messageId;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}