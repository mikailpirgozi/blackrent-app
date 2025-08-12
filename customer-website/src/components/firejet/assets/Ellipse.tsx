export default function Ellipse({ className = "" }: EllipseProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 1550 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_f_16289_14278)">
      <circle cx="400" cy="400" r="400" fill="#1E1E23"/>
      </g>
      <defs>
      <filter id="filter0_f_16289_14278" x="-500" y="-500" width="1800" height="1800" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="250" result="effect1_foregroundBlur_16289_14278"/>
      </filter>
      </defs>
      </svg>
      
    </div>
  );
}

interface EllipseProps {
  className?: string;
}
