import React from 'react';
import TOCCollapsible from '@theme-original/TOCCollapsible';
import { useAds } from '@site/src/hooks/use-ads';

export default function TOCCollapsibleWrapper(props) {
  useAds({ selector: '.ads-container.mobile', on: 'mobile' });

  return (
    <>
      <TOCCollapsible {...props} />
      <div class="ads-container mobile" />
    </>
  );
}
