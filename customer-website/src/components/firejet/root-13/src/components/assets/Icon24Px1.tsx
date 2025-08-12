export default function Icon24Px1({ className = "" }: Icon24Px1Props) {
  return (
    <div className={`${className}`}>
      <svg width="100%" height="100%" style={{"overflow":"visible"}} preserveAspectRatio="none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.0404 1C5.94301 1 1 5.94301 1 12.0404C1 17.2179 4.56473 21.5625 9.37349 22.7558V15.4144H7.09695V12.0404H9.37349V10.5866C9.37349 6.82889 11.0742 5.08716 14.7634 5.08716C15.4629 5.08716 16.6699 5.2245 17.1636 5.3614V8.4196C16.903 8.39221 16.4504 8.37853 15.8882 8.37853C14.078 8.37853 13.3785 9.06435 13.3785 10.8472V12.0404H16.9847L16.3652 15.4144H13.3785V23C18.8444 22.3398 23.0808 17.6851 23.0808 12.0404C23.0808 5.94301 18.1378 1 12.0404 1Z" fill="#A0A0A5"/>
      </svg>
      
    </div>
  );
}

interface Icon24Px1Props {
  className?: string;
}
