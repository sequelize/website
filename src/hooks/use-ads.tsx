import { useMediaQuery } from '@react-hookz/web'; // cjs
import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

const SCRIPT_URL = '//cdn.carbonads.com/carbon.js?serve=CEAI627Y&placement=sequelizeorg';

type OnEnvironment = 'mobile' | 'desktop' | 'all';

type InitProps = {
  ref?: MutableRefObject<HTMLInputElement | undefined>;
  selector?: string;
  on?: OnEnvironment;
};

function shouldRender(isMobile: boolean, on: OnEnvironment) {
  if (on === 'all') {
    return true;
  }

  if (on === 'mobile') {
    return isMobile;
  }

  return !isMobile;
}

export function useAds({ ref, selector, on = 'all' }: InitProps): void {
  const isMobile = useMediaQuery('(max-width: 996px)') ?? false;

  useEffect(() => {
    let container: HTMLElement | null = null;
    let script: HTMLScriptElement | null = null;

    if (shouldRender(isMobile, on)) {
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

      cleanAds(script);
    };
  }, [ref, selector, on, isMobile]);
}

function cleanAds(script: HTMLScriptElement | null) {
  script?.remove();
  document.querySelector('#carbonads')?.remove();
}
