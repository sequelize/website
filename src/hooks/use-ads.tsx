import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

const SCRIPT_URL
  = '//cdn.carbonads.com/carbon.js?serve=CEAI627Y&placement=sequelizeorg';

type OnEnvironment = 'mobile' | 'desktop' | 'all';

type InitProps = {
  ref?: MutableRefObject<HTMLInputElement | undefined>,
  selector?: string,
  on?: OnEnvironment,
};

function shouldRender(on: OnEnvironment) {
  const isMobile = window.matchMedia('(max-width: 996px)').matches;

  if (on === 'all') {
    return true;
  }

  if (on === 'mobile') {
    return isMobile;
  }

  return !isMobile;
}

export function useAds({ ref, selector, on = 'all' }: InitProps): void {
  useEffect(() => {
    let container: HTMLElement | null = null;
    let script: HTMLScriptElement | null = null;

    if (shouldRender(on)) {
      if (ref) {
        container = ref.current as any;
      } else if (selector) {
        container = document.querySelector(selector);
      }
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
  }, [ref, selector, on]);
}
