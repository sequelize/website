/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useAds } from '@site/src/hooks/use-ads';
import TOCItems from '@theme/TOCItems';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.css'; // Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';
export default function TOC({ className, ...props }) {
  useAds({ selector: '.ads-container.desktop', on: 'desktop' });

  return (
    <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
      <div className="ads-container desktop" />
      <TOCItems
        {...props}
        linkClassName={LINK_CLASS_NAME}
        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
      />
    </div>
  );
}
