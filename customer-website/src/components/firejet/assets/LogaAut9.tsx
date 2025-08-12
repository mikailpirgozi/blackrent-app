export default function LogaAut9({ className = "" }: LogaAut9Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46.9751 28L9 72.0613H27.4956L65.4707 28H46.9751Z" fill="#3C3C41"/>
      <path d="M72.8892 28L34.9141 72.0613H53.4187L91.0021 28.4464V28H72.8892Z" fill="#3C3C41"/>
      </svg>
      
    </div>
  );
}

interface LogaAut9Props {
  className?: string;
}
