export default function AnalyticsLoading() {
  return <section className="waitlist-analytics" aria-busy="true">
    <p role="status">Loading analytics…</p>
    <div className="waitlist-analytics-loading" aria-hidden="true">
      <div className="waitlist-analytics-loading-metrics">{[0, 1, 2, 3].map((item) => <div className="waitlist-analytics-loading-metric" key={item}><i /><i /></div>)}</div>
      <div className="waitlist-analytics-loading-chart"><i /><i /><i /><i /><i /></div>
    </div>
  </section>;
}
