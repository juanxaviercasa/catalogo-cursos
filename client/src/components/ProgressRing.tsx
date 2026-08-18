export function ProgressRing({ value, size = 52 }: { value: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${value}% completado`}>
      <svg viewBox="0 0 100 100" role="img">
        <circle className="progress-ring-track" cx="50" cy="50" r={radius} />
        <circle className="progress-ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span>{value}%</span>
    </div>
  );
}
