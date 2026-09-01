let dailyChart;
let monthlyChart;

function chartColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: dark ? '#3a342c' : '#e2d8c8',
    ink: dark ? '#f6f0e6' : '#1c1914',
    brand: '#c45c26'
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const [statsRes, chartsRes] = await Promise.all([
    api('/api/dashboard/stats'),
    api('/api/dashboard/charts')
  ]);
  const stats = statsRes.data;
  document.getElementById('statTotalQr').textContent = stats.totalQr;
  document.getElementById('statActive').textContent = stats.totalActive;
  document.getElementById('statDisabled').textContent = stats.totalDisabled;
  document.getElementById('statToday').textContent = stats.todayScans;
  document.getElementById('statMonth').textContent = stats.monthlyScans;
  document.getElementById('statScans').textContent = stats.totalScans;

  const colors = chartColors();
  dailyChart = new Chart(document.getElementById('dailyChart'), {
    type: 'line',
    data: {
      labels: chartsRes.data.daily.map((d) => d.day),
      datasets: [{
        label: 'Scans',
        data: chartsRes.data.daily.map((d) => d.total),
        borderColor: colors.brand,
        tension: 0.35,
        fill: false
      }]
    },
    options: { scales: { x: { ticks: { color: colors.ink } }, y: { ticks: { color: colors.ink } } } }
  });

  monthlyChart = new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: {
      labels: chartsRes.data.monthly.map((d) => d.month),
      datasets: [{
        label: 'Scans',
        data: chartsRes.data.monthly.map((d) => d.total),
        backgroundColor: colors.brand
      }]
    },
    options: { scales: { x: { ticks: { color: colors.ink } }, y: { ticks: { color: colors.ink } } } }
  });

  document.getElementById('topTable').innerHTML = chartsRes.data.top.map((row) => `
    <tr>
      <td><code>${escapeHtml(row.code)}</code></td>
      <td>${escapeHtml(row.title)}</td>
      <td>${row.scan_count}</td>
    </tr>
  `).join('') || '<tr><td colspan="3">No scans yet</td></tr>';

  document.getElementById('activityList').innerHTML = chartsRes.data.recent.map((row) => `
    <li>
      <strong>${escapeHtml(row.code)}</strong> scanned
      · ${escapeHtml(row.country || 'Unknown')}
      · ${formatDate(row.created_at)}
    </li>
  `).join('') || '<li>No recent activity</li>';
});
