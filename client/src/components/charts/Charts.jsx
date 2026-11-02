import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtDate, fmtShortDay } from '../../utils/format.js';

const COLORS = { mint: '#1f8461', sky: '#2b8bd9', coral: '#f25a42', sun: '#e0ac0c' };
const axis = { stroke: '#556562', fontSize: 12, tickLine: false };

function Frame({ title, description, children, height = 260, summary }) {
  return (
    <figure className="card p-5">
      <figcaption className="mb-3"><h3 className="text-base font-bold">{title}</h3>{description && <p className="text-sm text-ink-faint">{description}</p>}</figcaption>
      <div style={{ height }} role="img" aria-label={summary || title}>{children}</div>
    </figure>
  );
}

export function DailyBarChart({ title, description, data, series, summary }) {
  return (
    <Frame title={title} description={description} summary={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((d) => ({ ...d, label: fmtShortDay(d.date) }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9e8" />
          <XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} />
          <Tooltip cursor={{ fill: 'rgba(31,45,43,.05)' }} />
          {series.length > 1 && <Legend />}
          {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={COLORS[s.color]} radius={[6, 6, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function TrendLineChart({ title, description, data, series, summary }) {
  return (
    <Frame title={title} description={description} summary={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((d) => ({ ...d, label: fmtDate(`${d.weekStart}T12:00:00`) }))} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9e8" />
          <XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} /><Tooltip /><Legend />
          {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={COLORS[s.color]} strokeWidth={3} dot={{ r: 3 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function CategoryBarChart({ title, description, data, summary }) {
  const rows = data.filter((d) => d.minutes > 0 || d.approved > 0);
  return (
    <Frame title={title} description={description} summary={summary} height={Math.max(220, rows.length * 46 + 40)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e9e8" />
          <XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="label" width={140} {...axis} />
          <Tooltip cursor={{ fill: 'rgba(31,45,43,.05)' }} /><Bar dataKey="minutes" name="Minutes" fill={COLORS.mint} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}
