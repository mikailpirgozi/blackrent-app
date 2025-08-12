export default function Pattern({ className = "" }: PatternProps) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 304 304" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_16909_9035)">
      <g clip-path="url(#clip1_16909_9035)">
      <path d="M79.8921 101.348H0V150.391H59.573L87.1595 177.978L59.573 205.564H0V254.607H79.8921L122.607 211.892L88.6921 177.978L122.607 144.063L79.8921 101.348Z" fill="#F8FFC4"/>
      <path d="M79.8921 304.045H0V353.088H59.573L87.1595 380.674L59.573 408.261H0V457.303H79.8921L122.607 414.589L88.6921 380.674L122.607 346.76L79.8921 304.045Z" fill="#F8FFC4"/>
      <path d="M79.8921 506.742H0V555.784H59.573L87.1595 583.371L59.573 610.957H0V660H79.8921L122.607 617.285L88.6921 583.371L122.607 549.456L79.8921 506.742Z" fill="#F8FFC4"/>
      <path d="M251.542 0H171.649V49.0427H231.222L258.809 76.6292L231.222 104.216H171.649V153.258H251.542L294.256 110.544L260.342 76.6292L294.256 42.7146L251.542 0Z" fill="#F8FFC4"/>
      <path d="M251.542 202.697H171.649V251.739H231.222L258.809 279.326L231.222 306.912H171.649V355.955H251.542L294.256 313.24L260.342 279.326L294.256 245.411L251.542 202.697Z" fill="#F8FFC4"/>
      <path d="M251.542 405.393H171.649V454.436H231.222L258.809 482.022L231.222 509.609H171.649V558.652H251.542L294.256 515.937L260.342 482.022L294.256 448.108L251.542 405.393Z" fill="#F8FFC4"/>
      </g>
      </g>
      <defs>
      <clipPath id="clip0_16909_9035">
      <rect width="304" height="304" rx="24" fill="white"/>
      </clipPath>
      <clipPath id="clip1_16909_9035">
      <rect width="294.256" height="660" fill="white"/>
      </clipPath>
      </defs>
      </svg>
      
    </div>
  );
}

interface PatternProps {
  className?: string;
}
