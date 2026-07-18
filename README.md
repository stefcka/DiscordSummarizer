# 🤖 Discord Timeline Summarizer

A modern, high-performance desktop application built with **Tauri**, **React**, and **Rust** that extracts conversations from Discord channels over a specific date range, summarizes them using a local **Ollama** LLM, and posts the structured summary back to a channel of your choice.

It also supports pasting manual raw transcripts to synthesize and format discussions on the fly.

---

##  Features

- **On-Demand Discord Sync:** Select any server and text channel your bot is member of.
- **Precise Date & Time Ranges:** Set exact start and end boundaries to target specific conversations (e.g., meetings, overnight discussions, weekly updates).
- **High-Performance Snowflake Pagination:** The Rust backend calculates a custom Discord Snowflake ID from your selected end-range, paginating backwards instantly and avoiding rate-limits.
- **Local AI Processing:** Summarizes text completely offline using a local Ollama instance (compatible with `llama3`, `mistral`, `phi3`, etc.).
- **Dual-Pane Markdown Panel:** Live preview your rendered summary or edit the raw markdown output directly in the app before publishing.
- **One-Click Publish:** Send the final styled summary directly to a destination channel in Discord.
- **Pasted Transcript Support:** Paste chat history from Discord, Slack, Teams, or Zoom manually to summarize external conversations.
- **Zero-Configuration Client Mode:** Export settings to a portable `config.json` file next to the app's executable. Other members can run the app with pre-configured tokens and models in a clean, developer-hidden UI.

---

##  Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS (Modern Dark Mode & Custom Glassmorphism).
- **Backend:** Rust, Tauri v2 (for secure API handling, local system config operations, and native performance).
- **APIs & Tools:** Discord REST API (bypassing CORS restrictions via Rust), Ollama API.

---

##  Prerequisites

Before running the application, make sure you have the following installed and configured:

### 1. Discord Bot Setup
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a **New Application** and navigate to the **Bot** tab.
3. Click **Reset Token** and copy the bot token.
4. Invite your Bot to your desired servers with the following permissions:
   - **Read Messages/View Channels**
   - **Read Message History**
   - **Send Messages**
5. Ensure the Bot has been invited to the server as a member.

### 2. Local Ollama Installation
1. Download and install [Ollama](https://ollama.com/).
2. Run Ollama on your machine (default URL: `http://localhost:11434`).
3. Download a model of your choice using your command line:
   ```bash
   ollama pull llama3
   ```
   *(You can also use other models like `mistral`, `llama3.1`, `gemma2`, etc.)*

---

##  Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Setup Environment Variables (Optional)
Create a `.env` file in the root folder to pre-populate your bot token:
```env
VITE_BOT_TOKEN=your_discord_bot_token_here
```

### 3. Launching the App
We have provided a double-clickable batch script to make launching easy without typing terminal commands:
- **Windows:** Double-click the **`run-dev.bat`** file in the project folder.
- **Terminal:** Alternately, you can run:
  ```bash
  npm run tauri dev
  ```

---

##  Security Best Practices

> [!IMPORTANT]
> **Keep your Bot Token private.** 
> Discord automatically scans public GitHub repositories for bot tokens. If you push your token to GitHub, Discord's security system will **instantly revoke it**, rendering the token useless and forcing you to generate a new one.

- We have updated the project `.gitignore` to exclude `.env` files and `config.json`.
- Do not commit your credentials to your repository.
- Use the **Export Config for Members** feature to share the application with non-technical team members safely without hardcoding tokens in the codebase.

---

##  Configuration & Distribution

1. Enter your **Bot Token**, **Ollama API URL**, and **Ollama Model** in the settings panel.
2. Click **Connect** to fetch your server lists.
3. To share this setup with your team/members, click ** Export Config for Members**.
4. This writes a `config.json` next to your compiled executable.
5. When other users launch the app with that `config.json` file in the same directory, it will load automatically, connect, and hide the Developer Settings pane to keep the UI clean!

---

##  License

This project is licensed under the MIT License.
