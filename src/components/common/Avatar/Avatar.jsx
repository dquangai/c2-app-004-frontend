import './Avatar.css';
import { avatarFor } from '../../../utils/memberMapper';

const Avatar = ({ src, alt = "Avatar", size = "md", className = "", fallbackId = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const handleError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = avatarFor(alt, fallbackId);
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden border border-[#E5E7EB] flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={handleError} />
      ) : (
        <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] font-bold">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
export default Avatar;

