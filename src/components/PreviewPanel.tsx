interface PreviewPanelProps {
  summary: string;
  setSummary: (value: string) => void;
  loading: boolean;
  activeTab: "edit" | "preview";
  setActiveTab: (tab: "edit" | "preview") => void;
}

export default function PreviewPanel({
  summary,
  setSummary,
  loading,
  activeTab,
  setActiveTab,
}: PreviewPanelProps) {
  // Simple markdown helper to render headers and bullet points
  const renderMarkdown = (text: string) => {
    if (!text) return <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No summary generated yet.</p>;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("📌") || line.startsWith("**📌")) {
        return <h2 key={idx} style={{ color: "var(--text-primary)", fontSize: "1.35rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginTop: "0" }}>{line}</h2>;
      }
      if (line.startsWith("🗓️") || line.startsWith("**🗓️")) {
        return <p key={idx} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: "500" }}>{line}</p>;
      }
      if (line.startsWith("🔥") || line.startsWith("**🔥")) {
        return <h3 key={idx} style={{ color: "var(--accent-blurple)", marginTop: "24px", fontSize: "1.1rem" }}>{line}</h3>;
      }
      if (line.startsWith("✅") || line.startsWith("**✅")) {
        return <h3 key={idx} style={{ color: "var(--accent-green)", marginTop: "24px", fontSize: "1.1rem" }}>{line}</h3>;
      }
      if (line.startsWith("❓") || line.startsWith("**❓")) {
        return <h3 key={idx} style={{ color: "var(--accent-gold)", marginTop: "24px", fontSize: "1.1rem" }}>{line}</h3>;
      }
      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
        return <li key={idx} style={{ marginLeft: "16px", marginBottom: "6px", color: "var(--text-primary)" }}>{line.substring(1).trim()}</li>;
      }
      if (line.trim() === "") {
        return <br key={idx} />;
      }
      return <p key={idx} style={{ margin: "4px 0", color: "var(--text-primary)" }}>{line}</p>;
    });
  };

  return (
    <div className="panel-card preview-card">
      <div className="preview-tabs">
        <h2 className="panel-card-title">📝 Summary Result</h2>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
            disabled={!summary || loading}
          >
            Edit Raw (Markdown)
          </button>
          <button
            className={`tab-btn ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
            disabled={!summary || loading}
          >
            Live Preview
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", gap: "12px" }}>
          <div className="spinner" style={{ width: "32px", height: "32px" }}></div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Generating summary with Ollama...</p>
        </div>
      ) : activeTab === "edit" ? (
        <textarea
          className="textarea-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Your generated summary will appear here in Markdown format..."
          disabled={!summary}
        />
      ) : (
        <div className="rendered-summary-container">
          <div className="markdown-preview">
            {renderMarkdown(summary)}
          </div>
        </div>
      )}
    </div>
  );
}