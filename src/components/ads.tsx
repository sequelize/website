import type { MutableRefObject } from 'react';
import React, { useEffect, useRef } from 'react';

const SCRIPT_URL
  = '//cdn.carbonads.com/carbon.js?serve=CEAI627Y&placement=sequelizeorg';

export default function Ads(): JSX.Element {
  const containerRef = useRef<HTMLInputElement>();

  useAds({ ref: containerRef });

  return <div ref={containerRef} />;
}

type InitProps = {
  ref?: MutableRefObject<HTMLInputElement | undefined>,
  selector?: string,
};

export function useAds({ ref, selector }: InitProps): void {
  useEffect(() => {
    let container: HTMLElement | null = null;

    if (ref) {
      container = ref.current as any;
    } else if (selector) {
      container = document.querySelector(selector);
    }

    if (!container) {
      throw new Error('No ads container found!');
    }

    const script = document.createElement('script');

    script.id = '_carbonads_js';
    script.src = SCRIPT_URL;
    script.async = true;

    container.append(script);

    return () => {
      if (!container) {
        throw new Error('No ads container found!');
      }

      script.remove();
    };
  }, [ref, selector]);
}
