const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  upload: <><path d="M12 16V4m0 0 4 4m-4-4L8 8M5 15v4h14v-4" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" /></>,
  report: <><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" /></>,
  analytics: <><path d="M4 20V10m5 10V4m5 16v-7m5 7V7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3v-.1A1.7 1.7 0 0 0 10.7 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15a1.7 1.7 0 0 0-1.56-1.03h-.1v-3h.1A1.7 1.7 0 0 0 7.06 9.94 1.7 1.7 0 0 0 6.72 8.06L6.66 8l2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.3" /><path d="m21 15-4.8-4.8L7 20" /></>,
  alert: <path d="m12 3 9 16H3L12 3Zm0 6v4m0 3h.01" />,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" /></>,
  signout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  droplet: <><path d="M12 3.5s-6 6.1-6 10.6a6 6 0 0 0 12 0C18 9.6 12 3.5 12 3.5Z" /><path d="M9.2 15.1c.3 1.1 1.2 1.9 2.4 2.1" /></>,
  chat: <><path d="M5 6h14v10H8l-3 3V6Z" /><path d="M8 10h8M8 13h5" /></>,
  spark: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />,
}

export default function Icon({ name, className = 'h-4 w-4', strokeWidth = 1.8 }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.dashboard}</svg>
}
