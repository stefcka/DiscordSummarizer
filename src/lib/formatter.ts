// responsible for turning discord JSON into readable text format

// Import the DiscordMessage interface
import type { DiscordMessage, DiscordMentionUser } from "./types";

// ==============================
// Resolve raw Discord pings (<@id> or <@!id>) into readable @username text
// ==============================
function resolveMentions(
  content: string,
  mentions: DiscordMentionUser[] | undefined
): string {
  if (!mentions || mentions.length === 0) {
    return content;
  }

  let resolvedContent = content;

  for (const user of mentions) {
    // Discord raw pings can appear as <@123456789> or <@!123456789>
    const pingPattern = new RegExp(`<@!?${user.id}>`, "g");
    resolvedContent = resolvedContent.replace(pingPattern, `@${user.username}`);
  }

  return resolvedContent;
}

// ==============================
// Converts Discord messages into readable text for the AI
// ==============================
export function formatMessages(messages: DiscordMessage[]): string {

  // Loop through every message
  return messages

    // Convert each message into "[ID: message_id] Username: Message"
    .map((message) => {
      const readableContent = resolveMentions(message.content, message.mentions);
      return `[ID: ${message.id}] ${message.author.username}: ${readableContent}`;
    })

    // Reverse so the oldest message appears first
    .reverse()

    // Join everything into one large string
    .join("\n");
}