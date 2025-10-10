export default function Icon24Px1Root3({
  className = '',
}: Icon24Px1Root3Props) {
  return (
    <div className={`${className}`}>
      <svg
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.5 7C6.5 6.44772 6.94772 6 7.5 6H17.5C18.0523 6 18.5 6.44772 18.5 7V17C18.5 17.5523 18.0523 18 17.5 18C16.9477 18 16.5 17.5523 16.5 17V9.41421L8.20711 17.7071C7.81658 18.0976 7.18342 18.0976 6.79289 17.7071C6.40237 17.3166 6.40237 16.6834 6.79289 16.2929L15.0858 8H7.5C6.94772 8 6.5 7.55228 6.5 7Z"
          fill="#F0FF98"
        />
      </svg>
    </div>
  );
}

interface Icon24Px1Root3Props {
  className?: string;
}
