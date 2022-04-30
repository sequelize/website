import Toc from '@theme-original/TOC';
import React from 'react';

export default function TOCWrapper(props) {
  return (
    <>
      <div class="ads-container" />
      <Toc {...props} />
    </>
  );
}
