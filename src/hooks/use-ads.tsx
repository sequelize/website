import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

const SCRIPT_URL
  = '//cdn.carbonads.com/carbon.js?serve=CEAI627Y&placement=sequelizeorg';

type InitProps = {
  ref?: MutableRefObject<HTMLInputElement | undefined>,
  selector?: string,
};

export function useAds({ ref, selector }: InitProps): void {
  useEffect(() => {
    let container: HTMLElement | null = null;
    let script: HTMLScriptElement | null = null;

    if (ref) {
      container = ref.current as any;
    } else if (selector) {
      container = document.querySelector(selector);
    }

    if (container) {
      script = document.createElement('script');

      script.id = '_carbonads_js';
      script.src = SCRIPT_URL;
      script.async = true;

      container.append(script);
    }

    return () => {
      if (!container) {
        return;
      }

      script?.remove();
    };
  }, [ref, selector]);
}
