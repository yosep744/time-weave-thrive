import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme, type ThemeName } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setCurrentTheme, allThemes } = useTheme();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full hover-scale"
      >
        <Palette className="w-5 h-5" />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 premium-card animate-scale-in z-50 p-3">
            <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-2">
              테마 선택
            </p>
            <div className="space-y-1">
              {Object.entries(allThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentTheme(key as ThemeName);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    currentTheme === key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ background: theme.gradient }}
                  />
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="text-sm flex-1">{theme.displayName}</span>
                  {currentTheme === key && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
