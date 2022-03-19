import React from 'react';
import type { ReactNode } from 'react';
import TrashIcon from 'react-feather/dist/icons/trash-2';
import css from './deprecated.module.css';

type Props = {
  children: ReactNode,
};

export function Deprecated(props: Props) {
  return (
    <span title="This feature is deprecated and should not be used." className={css.deprecated}>
      <TrashIcon className={css.trashIcon} size={16} />
      {props.children}
    </span>
  );
}
