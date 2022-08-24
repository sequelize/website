import type { ChangeEvent, ReactNode } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../utils/use-storage';
import css from './dialect-table-filter.module.css';

type Props = {
  children: ReactNode,
};

const existingDialects = new Set(['PostgreSQL', 'MariaDB', 'MySQL', 'MSSQL', 'SQLite', 'Snowflake', 'db2', 'ibmi']);

export function DialectTableFilter(props: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [preferredDialect, setPreferredDialect] = useLocalStorage('preferred-dialect', 'all');

  const onDialectSelection = useCallback((e: ChangeEvent) => {
    const newDialect = (e.currentTarget as any).value;
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

      if (!existingDialects.has(columnTitle)) {
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

        if (!existingDialects.has(columnName)) {
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
        {Array.from(existingDialects).map(dialect => {
          return <option key={dialect} value={dialect}>{dialect}</option>;
        })}
      </select>
      <div ref={divRef}>
        {props.children}
      </div>
    </div>
  );
}

