type SourcePanelProps = {
  guilds: any[];
  channels: any[];
  sourceServer: string;
  setSourceServer: (value: string) => void;
  sourceChannel: string;
  setSourceChannel: (value: string) => void;
};

export default function SourcePanel({
  guilds,
  channels,
  sourceServer,
  setSourceServer,
  sourceChannel,
  setSourceChannel,
}: SourcePanelProps) {
  return (
    <div className="panel-card">
      <h2 className="panel-card-title">🔌 1. Source Connection</h2>
      <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Choose the Discord Server and Channel containing the discussion you want to summarize.
      </p>

      <div className="form-group">
        <label htmlFor="source-server-select">Discord Server</label>
        <select
          id="source-server-select"
          className="select-input"
          value={sourceServer}
          onChange={(e) => setSourceServer(e.target.value)}
        >
          <option value="">Select Server</option>
          {guilds.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="source-channel-select">Discord Channel</label>
        <select
          id="source-channel-select"
          className="select-input"
          value={sourceChannel}
          onChange={(e) => setSourceChannel(e.target.value)}
          disabled={!sourceServer}
        >
          <option value="">Select Channel</option>
          {channels.map((c: any) => (
            <option key={c.id} value={c.id}>
              # {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}