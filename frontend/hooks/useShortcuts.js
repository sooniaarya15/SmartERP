import { useEffect } from 'react';

export default function useShortcuts(shortcuts) {
  // shortcuts = [{ keys: ['ctrl','s'], action: handleSave }, ...]
  useEffect(() => {
    const handler = (e) => {
      shortcuts.forEach(({ keys, action }) => {
        const ctrl = keys.includes('ctrl') ? e.ctrlKey : true;
        const alt  = keys.includes('alt')  ? e.altKey  : true;
        const key  = keys[keys.length - 1];
        if (ctrl && alt && e.key.toLowerCase() === key) {
          e.preventDefault();
          action();
        }
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

useShortcuts([
  { keys: ['ctrl', 's'], action: handleSave },
  { keys: ['alt', 'c'],  action: handleCreate },
]);