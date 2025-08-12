export default function Icon32Px({ className = "" }: Icon32PxProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 9C8 8.44772 8.44772 8 9 8H23C23.5523 8 24 8.44772 24 9V23C24 23.5523 23.5523 24 23 24C22.4477 24 22 23.5523 22 23V11.4143L9.70717 23.7071C9.31664 24.0976 8.68348 24.0976 8.29295 23.7071C7.90243 23.3166 7.90243 22.6834 8.29295 22.2929L20.5858 10H9C8.44772 10 8 9.55228 8 9Z" fill="currentColor"/>
      </svg>
      
    </div>
  );
}

interface Icon32PxProps {
  className?: string;
}
