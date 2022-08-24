import React from 'react';
import type { ReactNode } from 'react';
import { Trash } from 'react-feather';
import css from './deprecated.module.css';

type Props = {
  children: ReactNode,
};

export function Deprecated(props: Props) {
  return (
    <span
      title="This feature is deprecated and should not be used."
      className={css.deprecated}
    >
      <Trash className={css.trashIcon} size={16} />
      {props.children}
    </span>
  );
}
