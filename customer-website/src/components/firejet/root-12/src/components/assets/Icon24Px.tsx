export default function Icon24Px({ className = "" }: Icon24PxProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 19C12.5523 19 13 18.5523 13 18C13 17.4477 12.5523 17 12 17C11.4477 17 11 17.4477 11 18C11 18.5523 11.4477 19 12 19Z" fill="#8CA40C"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M19 5C19 2.79086 17.2091 1 15 1L9 1C6.79086 1 5 2.79086 5 5L5 19C5 21.2091 6.79086 23 9 23H15C17.2091 23 19 21.2091 19 19V5ZM15 3C16.1046 3 17 3.89543 17 5V19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19L7 5C7 3.89543 7.89543 3 9 3L15 3Z" fill="#8CA40C"/>
      </svg>
      
    </div>
  );
}

interface Icon24PxProps {
  className?: string;
}
