import './Badge.css';
const Badge = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: "bg-[#EFF6FF] text-[#1D4ED8]",
    success: "bg-[#ECFDF5] text-[#047857]",
    warning: "bg-[#FFFBEB] text-[#B45309]",
    error: "bg-[#FEF2F2] text-[#B91C1C]",
    gray: "bg-[#F3F4F6] text-[#374151]"
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
export default Badge;

