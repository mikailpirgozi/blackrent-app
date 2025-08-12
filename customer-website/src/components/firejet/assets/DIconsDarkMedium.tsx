export default function DIconsDarkMedium({
  className = "",
}: DIconsDarkMediumProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 122 132" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Simplified search icon */}
        <circle cx="73.97" cy="75.97" r="15.97" fill="url(#paint0_linear)" />
        <path d="m88.02 83.56 2.93 7.39c.29 1 -.64 1.93-1.64 1.64l-7.39-2.93" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round"/>
        
        {/* Chat bubble */}
        <circle cx="59" cy="59" r="27" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint1_linear)" strokeOpacity="0.2"/>
        <path d="M35.1 71.57 32.42 82.31c-.49 1.98 1.3 3.77 3.28 3.28l10.74-2.68" stroke="url(#paint1_linear)" strokeOpacity="0.2" strokeWidth="1"/>
        
        {/* Three dots */}
        <circle cx="49" cy="59" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        <circle cx="59" cy="59" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        <circle cx="69" cy="59" r="3" fill="rgba(255, 255, 255, 0.5)"/>
        
        <defs>
          <linearGradient id="paint0_linear" x1="73.97" y1="60" x2="73.97" y2="91.94" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FAFFDC"/>
            <stop offset="1" stopColor="#D7FF14"/>
          </linearGradient>
          
          <linearGradient id="paint1_linear" x1="86" y1="86" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="white"/>
            <stop offset="1" stopColor="#D7FF14"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface DIconsDarkMediumProps {
  className?: string;
}