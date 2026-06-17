const SidebarToggleIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.75" />
    <line x1="9.5" y1="3.5" x2="9.5" y2="20.5" stroke="currentColor" strokeWidth="1.75" />
  </svg>
);

export default SidebarToggleIcon;
