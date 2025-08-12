export default function Icon32Px({ className = "" }: Icon32PxProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16 3C8.8203 3 3 8.8203 3 16C3 23.1797 8.8203 29 16 29C23.1797 29 29 23.1797 29 16C29 8.8203 23.1797 3 16 3ZM1 16C1 7.71573 7.71573 1 16 1C24.2843 1 31 7.71573 31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16ZM16 9.54492C16.5523 9.54492 17 9.99264 17 10.5449V15H21.4551C22.0074 15 22.4551 15.4477 22.4551 16C22.4551 16.5523 22.0074 17 21.4551 17H17V21.454C17 22.0063 16.5523 22.454 16 22.454C15.4477 22.454 15 22.0063 15 21.454V17H10.546C9.9937 17 9.54599 16.5523 9.54599 16C9.54599 15.4477 9.9937 15 10.546 15H15V10.5449C15 9.99264 15.4477 9.54492 16 9.54492Z" fill="#FAFAFF"/>
      </svg>
      
    </div>
  );
}

interface Icon32PxProps {
  className?: string;
}
