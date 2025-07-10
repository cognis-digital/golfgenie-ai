import React, { useState, useEffect } from 'react';
import { Settings, Eye, Type, Contrast, Volume2, Keyboard, MousePointer, Zap } from 'lucide-react';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicators: true
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Apply initial settings
    applySettings(settings);
  }, []);

  useEffect(() => {
    // Save settings to localStorage and apply them
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${newSettings.fontSize}%`;

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader mode
    if (newSettings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 100,
      highContrast: false,
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusIndicators: true
    };
    setSettings(defaultSettings);
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Accessibility Settings</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close accessibility settings"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Type className="h-5 w-5 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">
                      Font Size: {settings.fontSize}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="150"
                    step="25"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Adjust font size"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>Normal</span>
                    <span>Large</span>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Contrast className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">High Contrast</div>
                      <div className="text-xs text-gray-500">Increase color contrast for better visibility</div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('highContrast', !settings.highContrast)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle high contrast mode"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Reduce Motion</div>
                      <div className="text-xs text-gray-500">Minimize animations and transitions</div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle reduced motion"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Screen Reader Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Screen Reader Mode</div>
                      <div className="text-xs text-gray-500">Optimize for screen reader users</div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('screenReaderMode', !settings.screenReaderMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle screen reader mode"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Enhanced Focus */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Enhanced Focus</div>
                      <div className="text-xs text-gray-500">Stronger focus indicators for navigation</div>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('focusIndicators', !settings.focusIndicators)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      settings.focusIndicators ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-label="Toggle enhanced focus indicators"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Keyboard Shortcuts Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Keyboard className="h-5 w-5 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">Keyboard Shortcuts</h3>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><kbd className="bg-white px-1 rounded">Tab</kbd> - Navigate forward</div>
                    <div><kbd className="bg-white px-1 rounded">Shift+Tab</kbd> - Navigate backward</div>
                    <div><kbd className="bg-white px-1 rounded">Enter/Space</kbd> - Activate buttons</div>
                    <div><kbd className="bg-white px-1 rounded">Escape</kbd> - Close modals</div>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={resetSettings}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Skip to main content
      </a>
    </>
  );
};

export default AccessibilityWidget;