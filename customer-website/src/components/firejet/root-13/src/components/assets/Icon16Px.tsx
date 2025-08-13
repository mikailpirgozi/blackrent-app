export default function Icon16Px({ className = "" }: Icon16PxProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clipRule="evenodd" d="M7.28982 1.34367C7.68035 0.95315 8.31351 0.95315 8.70403 1.34367L14.6538 7.29342C14.8413 7.48096 14.9467 7.73531 14.9467 8.00053C14.9467 8.26575 14.8413 8.5201 14.6538 8.70764L8.70403 14.6574C8.31351 15.0479 7.68035 15.0479 7.28982 14.6574C6.8993 14.2669 6.8993 13.6337 7.28982 13.2432L11.5325 9.00049L2.04688 9.00049C1.49459 9.00049 1.04688 8.55278 1.04688 8.00049C1.04688 7.44821 1.49459 7.00049 2.04688 7.00049L11.5324 7.00049L7.28982 2.75789C6.8993 2.36736 6.8993 1.7342 7.28982 1.34367Z" fill="#141900"/>
      </svg>
      
    </div>
  );
}

interface Icon16PxProps {
  className?: string;
}
