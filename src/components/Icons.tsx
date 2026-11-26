// Small inline icons (no external files). They inherit the text colour.
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
);

export const MapPinIcon = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
);

export const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg {...base} width={size} height={size}><path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.5L3 21z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.3-1.2-1.8-1-.8.6c-.7-.3-1.5-1.1-1.8-1.8l.6-.8-1-1.8L9 9.5z" /></svg>
);
