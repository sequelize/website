import React from 'react';
import { useAds } from '../hooks/use-ads';

export function MobileAds(): JSX.Element {
  useAds({ selector: '.ads-container.mobile', on: 'mobile' });

  return <div className="ads-container mobile" />;
}
