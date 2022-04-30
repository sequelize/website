import { useAds } from '@site/src/hooks/use-ads';
import Toc from '@theme-original/TOC';
import React from 'react';

export default function TOCWrapper(props) {
  useAds({ selector: '.ads-container' });

  return (
    <>
      <div class="ads-container" />
      <Toc {...props} />
    </>
  );
}
