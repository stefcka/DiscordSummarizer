import { useState, useEffect } from "react";
import "./styles/App.css";
import Header from "./components/Header";
import SourcePanel from "./components/SourcePanel";
import TimelinePanel from "./components/TimelinePanel";
import PreviewPanel from "./components/PreviewPanel";
import DestinationPanel from "./components/DestinationPanel";
import { fetchGuilds, fetchChannels, sendMessageToChannel } from "./lib/discord";
import { summarizeConversation } from "./lib/summarizer";
import { summarizeWithOllama } from "./lib/ollama";
import { invoke } from "@tauri-apps/api/core";

function App() {
  // ----------------------------
  // SETTINGS
  // ----------------------------
  const [typedToken, setTypedToken] = useState(import.meta.env.VITE_BOT_TOKEN || "");
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3");
  const [hideSettings, setHideSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  // ----------------------------
  // SOURCE
  // ----------------------------
  const [sourceServer, setSourceServer] = useState("");
  const [sourceChannel, setSourceChannel] = useState("");
  const [guilds, setGuilds] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  // ----------------------------
  // DESTINATION
  // ----------------------------
  const [destServer, setDestServer] = useState("");
  const [destChannel, setDestChannel] = useState("");
  const [destChannels, setDestChannels] = useState<any[]>([]);
  // ----------------------------
  // TIMELINE
  // ----------------------------
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  // ----------------------------
  // SUMMARY STATE
  // ----------------------------
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [mode, setMode] = useState<"bot" | "manual">("bot");
  const [manualText, setManualText] = useState<string>("");
  // Map of username -> discord user id, built during summary generation,
  // used to convert @username into a real <@id> ping when publishing.
  const [usernameToIdMap, setUsernameToIdMap] = useState<Record<string, string>>({});
  // ----------------------------
  // CONSOLE LOG STATE
  // ----------------------------
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; msg: string; isError?: boolean }>>([]);
  const addLog = (msg: string, isError: boolean = false) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [...prev, { time, msg, isError }]);
  };
  // ----------------------------
  // READY CHECK
  // ----------------------------
  const isReady = Boolean(
    sourceChannel &&
    startDate &&
    startTime &&
    endDate &&
    endTime &&
    botToken &&
    !loading
  );
  // ----------------------------
  // PRESET DATE TIMELINE HANDLER
  // ----------------------------
  const handlePresetSelect = (hours: number) => {
    const end = new Date();
    const start = new Date();
    start.setHours(end.getHours() - hours);
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const formatTime = (d: Date) => d.toTimeString().substring(0, 5);
    setStartDate(formatDate(start));
    setStartTime(formatTime(start));
    setEndDate(formatDate(end));
    setEndTime(formatTime(end));
    addLog(`Applied preset range: Last ${hours} hours.`);
  };
  // ----------------------------
  // EXPORT CONFIG FILE
  // ----------------------------
  async function handleSaveConfig() {
    try {
      addLog("Exporting configuration settings to config.json next to executable...");
      await invoke("save_config", {
        config: {
          bot_token: typedToken,
          ollama_url: ollamaUrl,
          ollama_model: ollamaModel,
        }
      });
      addLog("Configuration exported successfully!");
      alert("Configuration successfully saved to config.json!\n\nYou can now share this config.json alongside the application with your members for a zero-configuration experience.");
      setIsConfigured(true);
      setHideSettings(true);
    } catch (err: any) {
      addLog(`Failed to export configuration: ${err.message || err}`, true);
      alert(`Export failed: ${err.message || err}`);
    }
  }
  // ----------------------------
  // APP START
  // ----------------------------
  useEffect(() => {
    handlePresetSelect(24);
    addLog("App launched. Connect your bot to load Discord servers.");
    async function checkConfig() {
      try {
        const config = await invoke<any>("load_config");
        if (config) {
          addLog("Detected config.json. Loading Bot Token and settings...");
          setTypedToken(config.bot_token);
          setBotToken(config.bot_token);
          setOllamaUrl(config.ollama_url);
          setOllamaModel(config.ollama_model);
          setIsConfigured(true);
          setHideSettings(true);
        } else if (typedToken) {
          addLog("Found bot token in environment. Connecting automatically...");
          setBotToken(typedToken);
        }
      } catch (err: any) {
        addLog(`Failed to load config.json: ${err.message || err}`, true);
      }
    }
    checkConfig();
  }, []);
  // ----------------------------
  // GUILD DATA SYNC
  // ----------------------------
  useEffect(() => {
    if (!botToken) {
      setGuilds([]);
      return;
    }
    async function loadGuilds() {
      try {
        addLog("Requesting servers (guilds) list from Discord REST API...");
        const guildData = await fetchGuilds(botToken);
        addLog(`Loaded ${guildData.length} servers successfully.`);
        setGuilds(guildData);
      } catch (err: any) {
        console.error(err);
        addLog(`Failed to fetch Discord servers: ${err.message || err}`, true);
        setGuilds([]);
      }
    }
    loadGuilds();
  }, [botToken]);
  // ----------------------------
  // SOURCE CHANNEL LOADER
  // ----------------------------
  useEffect(() => {
    if (!sourceServer) {
      setChannels([]);
      setSourceChannel("");
      return;
    }
    async function loadChannels() {
      try {
        addLog(`Loading text channels for source server ID ${sourceServer}...`);
        const data = await fetchChannels(sourceServer, botToken);
        addLog(`Found ${data.length} text channels.`);
        setChannels(data);
      } catch (err: any) {
        addLog(`Failed to fetch source channels: ${err.message || err}`, true);
        setChannels([]);
      }
    }
    loadChannels();
  }, [sourceServer, botToken]);
  // ----------------------------
  // DESTINATION CHANNEL LOADER
  // ----------------------------
  useEffect(() => {
    if (!destServer) {
      setDestChannels([]);
      setDestChannel("");
      return;
    }
    async function loadDestChannels() {
      try {
        addLog(`Loading text channels for destination server ID ${destServer}...`);
        const data = await fetchChannels(destServer, botToken);
        addLog(`Found ${data.length} destination channels.`);
        setDestChannels(data);
      } catch (err: any) {
        addLog(`Failed to fetch destination channels: ${err.message || err}`, true);
        setDestChannels([]);
      }
    }
    loadDestChannels();
  }, [destServer, botToken]);
  // ----------------------------
  // GENERATE SUMMARY PIPELINE
  // ----------------------------
  async function handleGenerateSummary() {
    if (!sourceChannel) return;
    try {
      setLoading(true);
      setSummary("");
      setUsernameToIdMap({});
      setActiveTab("preview");
      // Parse user local dates and times
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:59`);
      addLog(`Starting summarization pipeline...`);
      addLog(`Time range: ${start.toLocaleString()} to ${end.toLocaleString()}`);
      const result = await summarizeConversation(
        sourceChannel,
        botToken,
        start,
        end,
        ollamaUrl,
        ollamaModel,
        sourceServer, // guildId - sourceServer already holds the selected guild's id
        (status) => addLog(status)
      );
      setSummary(result.summary);
      setUsernameToIdMap(result.usernameToIdMap);
      addLog("Summary generated successfully! Ready to preview / edit.");
    } catch (err: any) {
      console.error(err);
      addLog(`Summarization pipeline aborted: ${err.message || err}`, true);
      alert(`Summarization Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }
  // ----------------------------
  // GENERATE MANUAL SUMMARY
  // ----------------------------
  async function handleGenerateManualSummary() {
    if (!manualText.trim()) return;
    try {
      setLoading(true);
      setSummary("");
      setUsernameToIdMap({});
      setActiveTab("preview");
      addLog("Starting manual transcript summarization...");
      addLog(`Sending pasted text to Ollama (${ollamaModel})...`);
      const prompt = `You are a professional conversation summarization assistant.
Your task is to analyze the following chat transcript and write a concise, structured summary.
Please write the summary using standard Markdown exactly in this format:
📌 **CONVERSATION SUMMARY**
🔥 **Main Topics & Discussions**
- [Provide 2-4 key topics or updates discussed in bullet points]
✅ **Decisions Made**
- [List any decisions made, or "None identified" if none]
❓ **Questions & Action Items**
- [List questions asked or actions assigned, or "None identified" if none]
Here is the transcript of the conversation:
${manualText}
Summary:`;
      const result = await summarizeWithOllama(ollamaUrl, ollamaModel, prompt);
      setSummary(result);
      addLog("Manual summary generated successfully! Ready to preview / edit.");
    } catch (err: any) {
      console.error(err);
      addLog(`Manual summarization failed: ${err.message || err}`, true);
      alert(`Summarization Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }
  // ----------------------------
  // PUBLISH SUMMARY BACK TO DISCORD
  // ----------------------------
  async function handleSendToDiscord() {
    if (!summary || !destChannel) return;
    try {
      setPublishing(true);
      addLog(`Sending formatted summary to channel ID ${destChannel}...`);

      // Convert @username text mentions back into real Discord pings <@id>
      // so the mentioned users actually get notified when this posts.
      let contentToSend = summary;
      for (const [username, id] of Object.entries(usernameToIdMap)) {
        const mentionPattern = new RegExp(`@${username}\\b`, "g");
        contentToSend = contentToSend.replace(mentionPattern, `<@${id}>`);
      }

      await sendMessageToChannel(destChannel, botToken, contentToSend);
      addLog(`Summary published successfully!`);
      alert("Summary successfully posted to Discord channel!");
    } catch (err: any) {
      console.error(err);
      addLog(`Failed to publish summary: ${err.message || err}`, true);
      alert(`Publish failed: ${err.message || err}`);
    } finally {
      setPublishing(false);
    }
  }
  return (
    <div className="app-container">
      {/* SIDEBAR PANEL */}
      <aside className="sidebar">
        <div className="app-title-container">
          <span className="app-logo">🤖</span>
          <h2 className="app-title">Timeline Summarizer</h2>
        </div>
        {isConfigured && (
          <button
            type="button"
            className="preset-chip"
            style={{ width: "100%", border: "1px solid rgba(255,255,255,0.08)", background: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            onClick={() => setHideSettings(!hideSettings)}
          >
            {hideSettings ? "⚙️ Show Config Panel" : "⚙️ Hide Config Panel"}
          </button>
        )}
        {/* API SETTINGS CONFIG */}
        {!hideSettings && (
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">⚙️ API Config</h3>

            <div className="form-group">
              <label htmlFor="bot-token-input">Bot Token</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <div className="input-wrapper" style={{ flexGrow: 1 }}>
                  <input
                    id="bot-token-input"
                    type={showToken ? "text" : "password"}
                    className="text-input"
                    placeholder="Discord Bot Token"
                    value={typedToken}
                    onChange={(e) => setTypedToken(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  type="button"
                  className="preset-chip"
                  style={{ padding: "10px 12px", border: "none", backgroundColor: "var(--accent-blurple)", color: "#fff", flexShrink: 0 }}
                  onClick={() => {
                    setBotToken(typedToken);
                    addLog("Manual connection triggered.");
                  }}
                >
                  Connect
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="ollama-url-input">Ollama API URL</label>
              <input
                id="ollama-url-input"
                type="text"
                className="text-input"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="ollama-model-input">Ollama Model</label>
              <input
                id="ollama-model-input"
                type="text"
                className="text-input"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="preset-chip"
              style={{ marginTop: "8px", width: "100%", border: "none", backgroundColor: "#353542", color: "#fff", cursor: "pointer" }}
              onClick={handleSaveConfig}
            >
              💾 Export Config for Members
            </button>
          </div>
        )}
        {/* RECENT STATUS LOGS */}
        <div className="sidebar-section" style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "150px" }}>
          <h3 className="sidebar-section-title">🖥️ Status Log</h3>
          <div className="console-panel" style={{ flexGrow: 1 }}>
            {consoleLogs.map((log, idx) => (
              <div key={idx} className={`console-line ${log.isError ? "console-error" : ""}`}>
                <span className="console-time">[{log.time}]</span>
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </aside>
      {/* MAIN LAYOUT */}
      <main className="main-content">
        <Header />
        {/* MODE SELECTOR */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            className={`tab-btn ${mode === "bot" ? "active" : ""}`}
            style={{ fontSize: "0.95rem", padding: "8px 16px", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
            onClick={() => {
              setMode("bot");
              setSummary("");
            }}
          >
            🤖 Discord Bot Sync
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === "manual" ? "active" : ""}`}
            style={{ fontSize: "0.95rem", padding: "8px 16px", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}
            onClick={() => {
              setMode("manual");
              setSummary("");
            }}
          >
            📋 Paste Transcript
          </button>
        </div>
        {mode === "bot" ? (
          <>
            <div className="dashboard-grid">
              {/* STEP 1: CHOOSE SOURCE */}
              <SourcePanel
                guilds={guilds}
                channels={channels}
                sourceServer={sourceServer}
                setSourceServer={setSourceServer}
                sourceChannel={sourceChannel}
                setSourceChannel={setSourceChannel}
              />
              {/* STEP 2: CHOOSE TIMELINE */}
              <TimelinePanel
                startDate={startDate}
                setStartDate={setStartDate}
                startTime={startTime}
                setStartTime={setStartTime}
                endDate={endDate}
                setEndDate={setEndDate}
                endTime={endTime}
                setEndTime={setEndTime}
                onPresetSelect={handlePresetSelect}
              />
              {/* STEP 3: CHOOSE PUBLISH DESTINATION */}
              <DestinationPanel
                guilds={guilds}
                channels={destChannels}
                destServer={destServer}
                setDestServer={setDestServer}
                destChannel={destChannel}
                setDestChannel={setDestChannel}
                onPublish={handleSendToDiscord}
                publishDisabled={!summary || loading || !destChannel}
                publishing={publishing}
              />
            </div>
            {/* PIPELINE GENERATE RUN BUTTON */}
            <div style={{ display: "flex", marginBottom: "24px" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                onClick={handleGenerateSummary}
                disabled={!isReady || loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Summarization In Progress...</span>
                  </>
                ) : (
                  <span>✨ Fetch and Generate Conversation Summary</span>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="panel-card" style={{ marginBottom: "24px" }}>
            <h2 className="panel-card-title">📋 Paste Chat Transcript</h2>
            <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Copy a discussion from any chat channel (e.g. Discord, Slack, Teams) and paste it below to generate a summary.
            </p>
            <textarea
              className="textarea-summary"
              style={{ height: "200px" }}
              placeholder="Paste chat messages here... (e.g.&#10;User1: Let's schedule the meeting for tomorrow.&#10;User2: Great idea, I'm free at 2 PM.)"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={handleGenerateManualSummary}
              disabled={!manualText.trim() || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Summarizing Paste...</span>
                </>
              ) : (
                <span>✨ Summarize Transcript</span>
              )}
            </button>
          </div>
        )}
        {/* STEP 4: PREVIEW & LIVE EDIT SUMMARY */}
        <PreviewPanel
          summary={summary}
          setSummary={setSummary}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </main>
    </div>
  );
}
export default App;