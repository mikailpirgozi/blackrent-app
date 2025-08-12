export default function BgRectangle1({ className = "" }: BgRectangle1Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 202 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M202 8C202 3.58172 198.418 0 194 0H24C19.5817 0 16 3.58172 16 8V38.1115C16 39.3534 15.7108 40.5783 15.1554 41.6892L8.04984 55.9003C5.47118 61.0576 10.9424 66.5288 16.0997 63.9502L30.3108 56.8446C31.4217 56.2892 32.6466 56 33.8885 56H194C198.418 56 202 52.4183 202 48V8Z" fill="#FAFFDC"/>
      </svg>
      
    </div>
  );
}

interface BgRectangle1Props {
  className?: string;
}
