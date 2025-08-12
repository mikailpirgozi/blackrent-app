export default function BgRectangle({ className = "" }: BgRectangleProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 65.23 63.53" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.68349 55.8415C7.2984 60.2168 11.3437 63.2652 15.719 62.6503L49.3881 57.9184C53.7634 57.3035 56.8118 53.2582 56.1969 48.8829L53.0374 26.402C52.9177 25.5505 52.9361 24.6853 53.0919 23.8397L55.2653 12.0382C56.1608 7.17566 51.1207 3.3777 46.6934 5.5788L35.9482 10.921C35.1782 11.3038 34.3516 11.5599 33.5001 11.6796L9.03871 15.1174C4.66343 15.7323 1.61505 19.7777 2.22995 24.1529L6.68349 55.8415Z" fill="#FAFFDC"/>
      </svg>
      
    </div>
  );
}

interface BgRectangleProps {
  className?: string;
}
