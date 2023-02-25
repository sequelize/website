import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../utils/use-storage';
import css from './dialect-table-filter.module.css';
import { SUPPORTED_DIALECTS } from '../utils/dialects';

type Props = {
  children: ReactNode,
};

export function DialectTableFilter(props: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [preferredDialect, setPreferredDialect] = useLocalStorage<string>('preferred-dialect', 'all');

  const onDialectSelection = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDialect = e.currentTarget.value;
    setPreferredDialect(newDialect);
  }, [setPreferredDialect]);

  useEffect(() => {
    const wrapper = divRef.current;
    if (!wrapper) {
      return;
    }

    const table = wrapper.querySelector('table');
    if (!table) {
      console.warn('DialectTableFilter expects to wrap a table');

      return;
    }

    const tableHeadRow = table.children[0].children[0];
    const columnTitles: string[] = Array.from(tableHeadRow.children).map(child => child.textContent ?? '');

    // @ts-expect-error -- html collection is iterable
    for (const columnHead of tableHeadRow.children) {
      const columnTitle = columnHead.textContent;

      if (!SUPPORTED_DIALECTS.has(columnTitle)) {
        continue;
      }

      if (preferredDialect !== 'all' && columnTitle !== preferredDialect) {
        columnHead.classList.add('hidden');
      } else {
        columnHead.classList.remove('hidden');
      }
    }

    const tableBody = table.children[1];
    // @ts-expect-error -- html collection is iterable
    for (const row of tableBody.children) {
      for (let i = 0; i < row.children.length; i++) {
        const child = row.children[i];

        const columnName = columnTitles[i];

        if (!SUPPORTED_DIALECTS.has(columnName)) {
          continue;
        }

        if (preferredDialect !== 'all' && columnName !== preferredDialect) {
          child.classList.add('hidden');
        } else {
          child.classList.remove('hidden');
        }
      }
    }
  }, [preferredDialect]);

  return (
    <div className={css.dialectTableWrapper}>
      <select onChange={onDialectSelection} value={preferredDialect} className={css.dialectSelector}>
        <option value="all">All</option>
        {Array.from(SUPPORTED_DIALECTS).map(dialect => {
          return <option key={dialect} value={dialect}>{dialect}</option>;
        })}
      </select>
      <div ref={divRef}>
        {props.children}
      </div>
    </div>
  );
}

