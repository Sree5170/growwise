import { Link } from 'react-router-dom';
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true"><rect width="64" height="64" rx="16" fill="#1a6a4f" /><path d="M32 50V30" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><path d="M32 32c0-9 6-15 15-15 0 9-6 15-15 15Z" fill="#ffd94d" /><path d="M32 38c0-7-5-12-12-12 0 7 5 12 12 12Z" fill="#aee6cf" /></svg>
  );
}
export default function Logo({ to = '/' }) {
  return <Link to={to} className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold text-mint-800"><LogoMark />GrowWise</Link>;
}
