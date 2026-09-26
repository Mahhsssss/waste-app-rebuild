const time = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// "Just now", "Today, 10:14 AM", "Yesterday, 4:30 PM" or "Sep 17, 1:15 PM"
export function formatWhen(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  if (now - d < 60 * 1000) return 'Just now';

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (d.getTime() >= startOfToday) return `Today, ${time(d)}`;
  if (d.getTime() >= startOfToday - dayMs) return `Yesterday, ${time(d)}`;

  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}, ${time(d)}`;
}
