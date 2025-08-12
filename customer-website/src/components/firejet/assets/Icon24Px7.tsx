export default function Icon24Px7({ className = "" }: Icon24Px7Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.2929 4.79289C11.6834 4.40237 12.3166 4.40237 12.7071 4.79289L19.7071 11.7929C20.0976 12.1834 20.0976 12.8166 19.7071 13.2071L12.7071 20.2071C12.3166 20.5976 11.6834 20.5976 11.2929 20.2071C10.9024 19.8166 10.9024 19.1834 11.2929 18.7929L16.5858 13.5L5 13.5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5L16.5858 11.5L11.2929 6.20711C10.9024 5.81658 10.9024 5.18342 11.2929 4.79289Z" fill="#141900"/>
      </svg>
      
    </div>
  );
}

interface Icon24Px7Props {
  className?: string;
}
