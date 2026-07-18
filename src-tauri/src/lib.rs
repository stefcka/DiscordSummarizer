// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiscordGuild {
    pub id: String,
    pub name: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiscordChannel {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub channel_type: u8,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiscordAuthor {
    pub id: String,
    pub username: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiscordMentionUser {
    pub id: String,
    pub username: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DiscordMessage {
    pub id: String,
    pub content: String,
    pub timestamp: String,
    pub author: DiscordAuthor,
    pub mentions: Option<Vec<DiscordMentionUser>>,
}
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
async fn discord_fetch_guilds(bot_token: String) -> Result<Vec<DiscordGuild>, String> {
    let client = reqwest::Client::new();
    let response = client.get("https://discord.com/api/v10/users/@me/guilds")
        .header("Authorization", format!("Bot {}", bot_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch guilds: {}", e))?;
    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Discord fetch guilds error: {}", err_text));
    }
    let guilds: Vec<DiscordGuild> = response.json().await
        .map_err(|e| format!("Failed to parse guilds JSON: {}", e))?;
    Ok(guilds)
}
#[tauri::command]
async fn discord_fetch_channels(guild_id: String, bot_token: String) -> Result<Vec<DiscordChannel>, String> {
    let client = reqwest::Client::new();
    let response = client.get(format!("https://discord.com/api/v10/guilds/{}/channels", guild_id))
        .header("Authorization", format!("Bot {}", bot_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch channels: {}", e))?;
    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Discord fetch channels error: {}", err_text));
    }
    let channels: Vec<DiscordChannel> = response.json().await
        .map_err(|e| format!("Failed to parse channels JSON: {}", e))?;
    // Filter for text channels (type 0)
    let text_channels = channels.into_iter()
        .filter(|c| c.channel_type == 0)
        .collect();
    Ok(text_channels)
}
#[tauri::command]
async fn discord_fetch_messages(
    channel_id: String,
    bot_token: String,
    start_date_ms: i64,
    end_date_ms: i64,
) -> Result<Vec<DiscordMessage>, String> {
    let client = reqwest::Client::new();
    let mut all_messages = Vec::new();
    // Use Snowflake calculation to start searching from the end_date_ms
    // Discord Epoch is Jan 1, 2015: 1420070400000 ms
    let end_snowflake = if end_date_ms > 1420070400000 {
        ((end_date_ms - 1420070400000) << 22) as u64
    } else {
        0
    };
    // We fetch in batches of 100
    // Discord messages endpoint: GET /channels/{channel_id}/messages?limit=100&before={message_id}
    let mut before_id: Option<String> = if end_snowflake > 0 {
        // before gets messages before this snowflake
        // Let's add 1 to end_snowflake to include any message exactly at end_date
        Some((end_snowflake + 1).to_string())
    } else {
        None
    };
    loop {
        let mut request = client.get(format!("https://discord.com/api/v10/channels/{}/messages", channel_id))
            .header("Authorization", format!("Bot {}", bot_token))
            .query(&[("limit", "100")]);
        if let Some(ref before) = before_id {
            request = request.query(&[("before", before)]);
        }
        let response = request.send().await
            .map_err(|e| format!("Failed to send request: {}", e))?;
        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Discord API returned error: {}", error_text));
        }
        let messages: Vec<DiscordMessage> = response.json().await
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;
        if messages.is_empty() {
            break;
        }
        // Update pagination cursor to the ID of the last message in the batch
        before_id = Some(messages.last().unwrap().id.clone());
        for msg in messages {
            // Parse message timestamp
            // Discord timestamps are ISO 8601 string: e.g. "2026-06-28T04:52:33.123000+00:00"
            let dt = chrono::DateTime::parse_from_rfc3339(&msg.timestamp)
                .map_err(|e| format!("Failed to parse timestamp {}: {}", msg.timestamp, e))?;
            let msg_ms = dt.timestamp_millis();
            // If the message is newer than our end date, skip it
            if msg_ms > end_date_ms {
                continue;
            }
            // If the message is older than our start date, we can stop fetching entirely!
            if msg_ms < start_date_ms {
                return Ok(all_messages);
            }
            all_messages.push(msg);
        }
    }
    Ok(all_messages)
}
#[tauri::command]
async fn discord_send_message(
    channel_id: String,
    bot_token: String,
    content: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let payload = serde_json::json!({
        "content": content
    });
    let response = client.post(format!("https://discord.com/api/v10/channels/{}/messages", channel_id))
        .header("Authorization", format!("Bot {}", bot_token))
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send message: {}", e))?;
    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Discord send message error: {}", err_text));
    }
    let res_json: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    let message_id = res_json["id"].as_str()
        .ok_or_else(|| "Response missing 'id' field".to_string())?;
    Ok(message_id.to_string())
}
#[tauri::command]
async fn ollama_summarize(
    ollama_url: String,
    model: String,
    prompt: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // We send a POST request to {ollama_url}/api/generate
    let url = format!("{}/api/generate", ollama_url.trim_end_matches('/'));
    
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });
    let response = client.post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;
    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama API returned error: {}", err_text));
    }
    let res_json: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;
    let summary = res_json["response"].as_str()
        .ok_or_else(|| "Ollama response missing 'response' field".to_string())?;
    Ok(summary.to_string())
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub bot_token: String,
    pub ollama_url: String,
    pub ollama_model: String,
}
#[tauri::command]
fn load_config() -> Result<Option<AppConfig>, String> {
    let mut path = std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;
    path.pop(); // Remove exe filename
    path.push("config.json");
    if !path.exists() {
        return Ok(None);
    }
    let file_content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    let config: AppConfig = serde_json::from_str(&file_content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    Ok(Some(config))
}
#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    let mut path = std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;
    path.pop(); // Remove exe filename
    path.push("config.json");
    let file_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(&path, file_content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    Ok(())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            discord_fetch_guilds,
            discord_fetch_channels,
            discord_fetch_messages,
            discord_send_message,
            ollama_summarize,
            load_config,
            save_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
