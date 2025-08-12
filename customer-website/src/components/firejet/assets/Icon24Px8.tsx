export default function Icon24Px8({ className = "" }: Icon24Px8Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9971 3C10.8925 3 9.99708 3.89543 9.99708 5V6H13.9971V5C13.9971 3.89543 13.1016 3 11.9971 3ZM15.9971 6V5C15.9971 2.79086 14.2062 1 11.9971 1C9.78794 1 7.99708 2.79086 7.99708 5V6H5.82449C4.76912 6 3.89538 6.82003 3.82851 7.87327L3.0666 19.8733C2.99345 21.0254 3.90816 22 5.06258 22H18.9316C20.086 22 21.0007 21.0254 20.9276 19.8733L20.1656 7.87327C20.0988 6.82003 19.225 6 18.1697 6H15.9971ZM5.82449 8L5.06258 20H18.9316L18.1697 8H5.82449Z" fill="#141900"/>
      </svg>
      
    </div>
  );
}

interface Icon24Px8Props {
  className?: string;
}
