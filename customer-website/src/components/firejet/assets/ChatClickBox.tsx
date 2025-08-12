export default function ChatClickBox({
  className = "",
}: ChatClickBoxProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 58 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Simplified gradient bubble */}
        <circle cx="30" cy="28" r="28" fill="url(#paint0_linear)" />
        
        {/* Chat background */}
        <circle cx="29" cy="24" r="25" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint1_linear)" strokeWidth="0.5"/>
        
        {/* Three dots */}
        <circle cx="17" cy="24" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        <circle cx="29" cy="24" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        <circle cx="41" cy="24" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        
        <defs>
          <linearGradient id="paint0_linear" x1="30" y1="0" x2="30" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FAFFDC"/>
            <stop offset="1" stopColor="#D7FF14"/>
          </linearGradient>
          
          <linearGradient id="paint1_linear" x1="54" y1="54" x2="4" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="white"/>
            <stop offset="1" stopColor="#D7FF14"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface ChatClickBoxProps {
  className?: string;
}