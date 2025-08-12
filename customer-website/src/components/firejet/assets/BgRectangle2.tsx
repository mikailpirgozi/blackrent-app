export default function BgRectangle2({ className = "" }: BgRectangle2Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 69.75 60.47" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.3482 7.98051C3.6564 3.573 7.47925 0.249848 11.8868 0.558052L53.7845 3.48782C58.192 3.79603 61.5151 7.61887 61.2069 12.0264L59.6233 34.6729C59.5633 35.5306 59.642 36.3925 59.8564 37.2252L62.8477 48.8463C64.0803 53.6345 59.3174 57.7748 54.7474 55.8879L43.6556 51.3083C42.8608 50.9801 42.0183 50.7823 41.1606 50.7223L8.53845 48.4411C4.13094 48.1329 0.807787 44.3101 1.11599 39.9026L3.3482 7.98051Z" fill="#FAFFDC"/>
      </svg>
      
    </div>
  );
}

interface BgRectangle2Props {
  className?: string;
}
