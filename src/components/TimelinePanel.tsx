type TimelinePanelProps = {
  startDate: string;
  setStartDate: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  onPresetSelect: (hours: number) => void;
};

export default function TimelinePanel({
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  onPresetSelect,
}: TimelinePanelProps) {
  return (
    <div className="panel-card">
      <h2 className="panel-card-title">📅 2. Selected Timeline</h2>
      <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Define the starting and ending boundaries for the conversation messages.
      </p>

      <div className="form-group">
        <label>Quick Presets</label>
        <div className="presets-container">
          <button type="button" className="preset-chip" onClick={() => onPresetSelect(24)}>
            Last 24h
          </button>
          <button type="button" className="preset-chip" onClick={() => onPresetSelect(72)}>
            Last 3 Days
          </button>
          <button type="button" className="preset-chip" onClick={() => onPresetSelect(168)}>
            Last Week
          </button>
        </div>
      </div>

      <div className="panel-row-2col">
        <div className="form-group">
          <label htmlFor="start-date-input">Start Date</label>
          <input
            id="start-date-input"
            type="date"
            className="text-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="start-time-input">Start Time</label>
          <input
            id="start-time-input"
            type="time"
            className="text-input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-row-2col">
        <div className="form-group">
          <label htmlFor="end-date-input">End Date</label>
          <input
            id="end-date-input"
            type="date"
            className="text-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="end-time-input">End Time</label>
          <input
            id="end-time-input"
            type="time"
            className="text-input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}