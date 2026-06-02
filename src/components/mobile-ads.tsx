import type { ReactElement } from 'react';
import React from 'react';
import { useAds } from '../hooks/use-ads';

export function MobileAds(): ReactElement {
  useAds({ selector: '.ads-container.mobile', on: 'mobile' });

  return <div className="ads-container mobile" />;
}
