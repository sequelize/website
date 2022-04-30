import React, { useRef } from 'react';
import { useAds } from '../hooks/use-ads';

export default function Ads(): JSX.Element {
  const containerRef = useRef<HTMLInputElement>();

  useAds({ ref: containerRef });

  return <div ref={containerRef} />;
}
