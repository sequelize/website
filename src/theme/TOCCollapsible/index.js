import { useAds } from '@site/src/hooks/use-ads';
import TOCCollapsible from '@theme-original/TOCCollapsible';
import React from 'react';

export default function TOCCollapsibleWrapper(props) {
  useAds({ selector: '.ads-container.mobile', on: 'mobile' });

  return (
    <>
      <TOCCollapsible {...props} />
      <div className="ads-container mobile" />
    </>
  );
}
