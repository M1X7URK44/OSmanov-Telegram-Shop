// src/types/react-world-flags.d.ts
declare module 'react-world-flags' {
  import { ComponentType, SVGProps } from 'react';

  interface FlagProps extends SVGProps<SVGSVGElement> {
    code: string;
    height?: number | string;
    width?: number | string;
    className?: string;
    style?: React.CSSProperties;
    fallback?: React.ReactNode;
  }

  const Flag: ComponentType<FlagProps>;
  export default Flag;
}