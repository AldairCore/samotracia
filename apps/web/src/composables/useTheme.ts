import { ref, watchEffect } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'samotracia-theme';

function readInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const theme = ref<Theme>(readInitialTheme());

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem(STORAGE_KEY, theme.value);
});

export function useTheme() {
  function setTheme(next: Theme) {
    theme.value = next;
  }

  return { theme, setTheme };
}
