// Fetch Discord messages
import { fetchMessages } from "./discord";
// Format messages into readable text
import { formatMessages } from "./formatter";
// Send text to Ollama for summarization
import { summarizeWithOllama } from "./ollama";
import type { DiscordMessage } from "./types";

/**
 * Main pipeline:
 * Discord Messages → Format → AI Summary
 */
export async function summarizeConversation(
  channelId: string,
  botToken: string,
  startDate: Date,
  endDate: Date,
  ollamaUrl: string,
  model: string,
  guildId: string,
  onStatusChange?: (status: string) => void
): Promise<{ summary: string; usernameToIdMap: Record<string, string> }> {

  if (onStatusChange) {
    onStatusChange(`Fetching messages from Discord in server ${guildId}...`);
  }
  // Step 1: Get filtered Discord messages
  const messages = await fetchMessages(
    channelId,
    botToken,
    startDate,
    endDate
  );
  if (messages.length === 0) {
    throw new Error("No messages found in the selected date range.");
  }
  if (onStatusChange) {
    onStatusChange(`Fetched ${messages.length} messages. Preparing transcript...`);
  }

  // Step 2: Convert messages into readable text
  const conversationText = formatMessages(messages);

  // Step 2b: Build a username -> id map from authors AND mentioned users
  const usernameToIdMap = buildUsernameToIdMap(messages);

  // Step 2c: Build the "who mentioned who" section directly from data,
  // instead of asking the LLM to find it (more reliable, exact usernames).
  const mentionsSection = buildMentionsSection(messages);

  if (onStatusChange) {
    onStatusChange(`Sending transcript to Ollama (${model})...`);
  }

  // Step 3: Send to AI for summarization
  const dateRangeStr = `${startDate.toLocaleString()} to ${endDate.toLocaleString()}`;

  const prompt = `You are a professional Discord channel summarization assistant.
Your task is to analyze the following chat transcript and write a concise, structured summary.
Please write the summary using standard Markdown exactly in this format:

📌 **DISCORD CONVERSATION SUMMARY**

🗓️ **Date Range**: ${dateRangeStr}

🔥 **Main Topics & Discussions**
- [Provide 2-4 key topics or updates discussed in bullet points]

✅ **Decisions Made**
- [List any decisions made, or "None identified" if none]

❓ **Questions & Action Items**
- [List questions asked or actions assigned, or "None identified" if none]

Here is the transcript of the conversation (ordered oldest to newest):
${conversationText}

Summary:`;

  let summary = await summarizeWithOllama(ollamaUrl, model, prompt);

  // Append the deterministic mentions section onto the LLM's summary
  summary = `${summary.trim()}\n\n${mentionsSection}`;

  if (onStatusChange) {
    onStatusChange("Summary generated successfully!");
  }

  // Step 4: Return both the summary text and the username->id map
  return { summary, usernameToIdMap };
}

// ==============================
// Build a dictionary of username -> id from every author and every
// mentioned user seen across all fetched messages.
// ==============================
function buildUsernameToIdMap(messages: DiscordMessage[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const message of messages) {
    map[message.author.username] = message.author.id;

    if (message.mentions) {
      for (const mentioned of message.mentions) {
        map[mentioned.username] = mentioned.id;
      }
    }
  }

  return map;
}

// ==============================
// Build a "📢 Mentions" markdown section listing who mentioned who,
// built directly from Discord data (not the LLM), so usernames are
// guaranteed to exactly match usernameToIdMap for reliable ping conversion.
// ==============================
function buildMentionsSection(messages: DiscordMessage[]): string {
  const lines: string[] = [];

  for (const message of messages) {
    if (message.mentions && message.mentions.length > 0) {
      for (const mentioned of message.mentions) {
        lines.push(`• @${message.author.username} mentioned @${mentioned.username}`);
      }
    }
  }

  if (lines.length === 0) {
    return `📢 **Mentions**\n• None identified`;
  }

  return `📢 **Mentions**\n${lines.join("\n")}`;
}