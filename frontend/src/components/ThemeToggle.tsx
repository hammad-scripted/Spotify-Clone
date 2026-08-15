import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return <button
    type="button"
    onClick={toggleTheme}
    className={cn('theme-toggle group relative flex h-9 w-[62px] shrink-0 items-center rounded-full border border-white/10 bg-white/[.055] p-1 shadow-inner transition duration-300 hover:border-violet-400/40', className)}
    aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    aria-pressed={isLight}
  >
    <Sun className="absolute left-2 size-3.5 text-amber-300 transition" />
    <Moon className="absolute right-2 size-3.5 text-violet-300 transition" />
    <span className={cn('relative z-10 grid size-7 place-items-center rounded-full bg-white text-black shadow-md transition-transform duration-300', isLight ? 'translate-x-[26px]' : 'translate-x-0')}>
      {isLight ? <Sun className="size-3.5 text-amber-600" /> : <Moon className="size-3.5 text-violet-700" />}
    </span>
  </button>;
}
