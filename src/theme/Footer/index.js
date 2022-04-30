import { useAds } from '@site/src/hooks/use-ads';
import Footer from '@theme-original/Footer';
import React from 'react';

export default function FooterWrapper(props) {
  useAds({ selector: '.ads-container' });

  return (
    <Footer {...props} />
  );
}
