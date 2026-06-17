import './Button.css';
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#002855] text-white hover:bg-[#001a3a]",
    secondary: "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]",
    outline: "border border-[#002855] text-[#002855] hover:bg-[#e8eef8]",
    accent: "bg-[#fbbf24] text-[#001a3a] hover:bg-[#d97706] hover:text-white",
    ghost: "bg-transparent hover:bg-[#F3F4F6] text-[#374151]"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
export default Button;

