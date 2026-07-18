type DestinationPanelProps = {
  guilds: any[];
  channels: any[];
  destServer: string;
  setDestServer: (value: string) => void;
  destChannel: string;
  setDestChannel: (value: string) => void;
  onPublish: () => void;
  publishDisabled: boolean;
  publishing: boolean;
};

export default function DestinationPanel({
  guilds,
  channels,
  destServer,
  setDestServer,
  destChannel,
  setDestChannel,
  onPublish,
  publishDisabled,
  publishing,
}: DestinationPanelProps) {
  return (
    <div className="panel-card">
      <h2 className="panel-card-title">🚀 3. Publish Summary</h2>
      <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Choose where to send the final summary, then publish it back to Discord.
      </p>

      <div className="form-group">
        <label htmlFor="dest-server-select">Destination Server</label>
        <select
          id="dest-server-select"
          className="select-input"
          value={destServer}
          onChange={(e) => setDestServer(e.target.value)}
        >
          <option value="">Select Destination Server</option>
          {guilds.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="dest-channel-select">Destination Channel</label>
        <select
          id="dest-channel-select"
          className="select-input"
          value={destChannel}
          onChange={(e) => setDestChannel(e.target.value)}
          disabled={!destServer}
        >
          <option value="">Select Destination Channel</option>
          {channels.map((c: any) => (
            <option key={c.id} value={c.id}>
              # {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn-success"
        style={{ marginTop: "10px" }}
        onClick={onPublish}
        disabled={publishDisabled || publishing}
      >
        {publishing ? (
          <>
            <div className="spinner"></div>
            <span>Publishing...</span>
          </>
        ) : (
          <>
            <span>📤 Publish to Discord</span>
          </>
        )}
      </button>
    </div>
  );
}