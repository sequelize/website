/**
 * Source: https://gist.github.com/Ephys/79974c286e92665dcaae9c8f5344afaf
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const eventTargets = new WeakMap();

function getEventTarget(storage: Storage) {
  if (eventTargets.has(storage)) {
    return eventTargets.get(storage);
  }

  let eventTarget;
  try {
    eventTarget = new EventTarget();
  } catch {
    // fallback to a div as EventTarget on Safari
    // because EventTarget is not constructable on Safari
    eventTarget = document.createElement('div');
  }

  eventTargets.set(storage, eventTarget);

  return eventTarget;
}

export type TStorageSetValue<T> = (newValue: T | undefined | ((oldValue: T) => T)) => void;

export type TJsonSerializable = number | boolean | string | null
  | TJsonSerializable[]
  | { [key: string]: TJsonSerializable };

type TStorageHook = <T extends TJsonSerializable>(key: string, defaultValue: T) => [T, TStorageSetValue<T>];

let lastHookId = 0;
export function createStorageHook(storage: Storage = new Storage()): TStorageHook {

  // window.onstorage only triggers cross-realm. This is used to notify other useLocalStorage on the same page that it changed

  return function useStorage<T extends TJsonSerializable>(key: string, defaultValue: T): [
    /* get */ T,
    /* set */ TStorageSetValue<T>,
  ] {

    const hookIdRef = useRef<number | null>(null);
    if (hookIdRef.current === null) {
      hookIdRef.current = lastHookId++;
    }

    const defaultValueRef = useRef(Object.freeze(defaultValue));
    const eventTarget = getEventTarget(storage);

    const [value, setValueState] = useState(() => {
      const _value = storage.getItem(key);

      if (_value == null) {
        return defaultValueRef.current;
      }

      try {
        return JSON.parse(_value);
      } catch (error) {
        console.error('use-local-storage: invalid stored value format, resetting to default');
        console.error(error);

        return defaultValueRef.current;
      }
    });

    const currentValue = useRef(value);
    currentValue.current = value;

    const setValue: TStorageSetValue<T> = useCallback((val: T | ((oldVal: T) => T)) => {
      if (typeof val === 'function') {
        val = val(currentValue.current);
      }

      if (currentValue.current === val) {
        return;
      }

      // removeItem
      if (val === undefined) {
        currentValue.current = defaultValueRef.current;
        setValueState(defaultValueRef.current);

        if (storage.getItem(key) == null) {
          return;
        }

        storage.removeItem(key);
      } else {
        const stringified = JSON.stringify(val);
        currentValue.current = val;
        setValueState(val);

        if (stringified === storage.getItem(key)) {
          return;
        }

        storage.setItem(key, stringified);
      }

      eventTarget.dispatchEvent(new CustomEvent(`uls:storage:${key}`, { detail: { val, sourceHook: hookIdRef.current } }));
    }, [eventTarget, key]);

    useEffect(() => {
      function crossRealmOnChange(e: StorageEvent) {
        if (e.key !== key) {
          return;
        }

        try {
          if (e.newValue == null) {
            setValue();

            return;
          }

          setValue(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }

      function sameRealmOnChange(e: CustomEvent) {
        // don't act on events we sent
        if (e.detail.sourceHook === hookIdRef.current) {
          return;
        }

        setValue(e.detail.val); // "val" is wrapped in an object to prevent undefined from being translated into null
      }

      eventTarget.addEventListener(`uls:storage:${key}`, sameRealmOnChange);
      window.addEventListener('storage', crossRealmOnChange);

      return () => {
        eventTarget.removeEventListener(`uls:storage:${key}`, sameRealmOnChange);
        window.removeEventListener('storage', crossRealmOnChange);
      };
    }, [eventTarget, key, setValue]);

    return [value, setValue];
  };
}

// in non-browser contexts, we fallback to useState
function useSsrStorageHook<T>(_key: string, defaultValue: T): [T, TStorageSetValue<T>] {
  return useState<T>(defaultValue);
}

export const useLocalStorage: TStorageHook = typeof localStorage === 'undefined' ? useSsrStorageHook
  : createStorageHook(localStorage);

export const useSessionStorage: TStorageHook = typeof sessionStorage === 'undefined' ? useSsrStorageHook
  : createStorageHook(sessionStorage);
