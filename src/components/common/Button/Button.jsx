import './Button.css';
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-semibold transition-colors duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#3d5f8f] text-white hover:bg-[#2f4d72]",
    secondary: "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]",
    outline: "border border-[#3d5f8f] text-[#3d5f8f] hover:bg-[#e8f0fa]",
    accent: "bg-[#d4a827] text-[#1e3348] hover:bg-[#b8890f] hover:text-white",
    ghost: "bg-transparent hover:bg-[#F3F4F6] text-[#374151]"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
export default Button;

