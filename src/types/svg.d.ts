// TypeScript deklarácie pre SVG importy s vite-plugin-svgr
declare module '*.svg?react' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
