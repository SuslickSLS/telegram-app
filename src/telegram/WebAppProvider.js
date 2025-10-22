import { createContext, useContext, useEffect, useState } from 'react';
import { init, backButton, mainButton, viewport } from '@tma.js/sdk';

const TelegramContext = createContext();

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};

export const TelegramProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    const initWebApp = async () => {
      try {
        // Инициализируем основные компоненты Telegram Web App
        await init();
        
        const app = {
          // Основные методы
          ready: () => console.log('Telegram Web App ready'),
          initData: window.Telegram?.WebApp?.initData || '',
          initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe || {},
          themeParams: window.Telegram?.WebApp?.themeParams || {},
          platform: window.Telegram?.WebApp?.platform || 'unknown',
          
          // Кнопки
          MainButton: mainButton,
          BackButton: backButton,
          
          // Viewport
          Viewport: viewport,
          
          // Методы для взаимодействия с Telegram
          sendData: (data) => {
            if (window.Telegram?.WebApp?.sendData) {
              window.Telegram.WebApp.sendData(data);
            }
          },
          showAlert: (message) => {
            if (window.Telegram?.WebApp?.showAlert) {
              window.Telegram.WebApp.showAlert(message);
            } else {
              // Используем window.alert вместо confirm
              window.alert(message);
            }
          },
          showConfirm: (message) => {
            if (window.Telegram?.WebApp?.showConfirm) {
              return Promise.resolve(window.Telegram.WebApp.showConfirm(message));
            } else {
              // Используем window.confirm с явным указанием window
              return Promise.resolve(window.confirm(message));
            }
          },
          close: () => {
            if (window.Telegram?.WebApp?.close) {
              window.Telegram.WebApp.close();
            }
          }
        };

        // Помечаем приложение как готовое
        if (window.Telegram?.WebApp?.ready) {
          window.Telegram.WebApp.ready();
        }
        
        setWebApp(app);
      } catch (error) {
        console.error('Error initializing Telegram Web App:', error);
        // Fallback для разработки вне Telegram
        setWebApp(createFallbackWebApp());
      }
    };

    initWebApp();
  }, []);

  const createFallbackWebApp = () => {
    // Создаем безопасную функцию confirm
    const safeConfirm = (message) => {
      return window.confirm(message);
    };

    return {
      ready: () => console.log('Fallback Web App ready'),
      initData: '',
      initDataUnsafe: {
        user: {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'en'
        }
      },
      themeParams: {
        bg_color: '#18222d',
        text_color: '#ffffff',
        hint_color: '#999999',
        link_color: '#4e8ee3',
        button_color: '#4e8ee3',
        button_text_color: '#ffffff'
      },
      platform: 'tdesktop',
      sendData: (data) => console.log('Data sent:', data),
      showAlert: (message) => window.alert(message),
      showConfirm: (message) => Promise.resolve(safeConfirm(message)),
      close: () => console.log('App closed'),
      MainButton: {
        show: () => console.log('MainButton shown'),
        hide: () => console.log('MainButton hidden'),
        setText: (text) => console.log('MainButton text:', text),
        onClick: (callback) => console.log('MainButton click handler set'),
        offClick: (callback) => console.log('MainButton click handler removed')
      },
      BackButton: {
        show: () => console.log('BackButton shown'),
        hide: () => console.log('BackButton hidden'),
        onClick: (callback) => console.log('BackButton click handler set')
      }
    };
  };

  const value = {
    webApp,
    user: webApp?.initDataUnsafe?.user,
    queryId: webApp?.initDataUnsafe?.query_id,
    themeParams: webApp?.themeParams,
    platform: webApp?.platform,
    sendData: (data) => webApp?.sendData(JSON.stringify(data)),
    showAlert: (message) => webApp?.showAlert(message),
    showConfirm: (message) => webApp?.showConfirm(message),
    closeApp: () => webApp?.close()
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};