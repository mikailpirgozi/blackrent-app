export default function Group({ className = "" }: GroupProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M130.32 0H0V80H97.18L142.18 125L97.18 170H0V250H130.32L200 180.32L144.68 125L200 69.68L130.32 0Z" fill="#0F0F14"/>
      </svg>
      
    </div>
  );
}

interface GroupProps {
  className?: string;
}
