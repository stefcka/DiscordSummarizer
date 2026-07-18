
// ==============================
// Represents a Discord message
// ==============================
export interface DiscordMentionUser {
  id: string;
  username: string;
}
// ==============================
// Represents a Discord message
// ==============================
export interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
  };
  mentions?: DiscordMentionUser[];
}
  // List of mentioned users
 
// ====================================
// User-selected timeline
// ====================================
export interface Timeline {

  // Beginning of the summary range
  start: Date;

  // End of the summary range
  end: Date;
}