export default function Ellipse1({ className = "" }: Ellipse1Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="6.5" fill="#3CEB82" stroke="#F0F0F5"/>
      </svg>
      
    </div>
  );
}

interface Ellipse1Props {
  className?: string;
}
