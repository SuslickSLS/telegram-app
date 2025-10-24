import { useState, useEffect } from "react";

function AccessControl({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'granted' | 'denied'
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        // Если не в Telegram, разрешаем доступ для разработки
        console.log("Не в Telegram окружении - разрешаем доступ");
        setStatus('granted');
        return;
      }

      tg.ready();
      const userData = tg.initDataUnsafe?.user;
      setUser(userData);

      if (!userData) {
        setStatus('denied');
        return;
      }

      // Отправляем данные на бэкенд для проверки
      const response = await fetch('https://my-telegram-app-production.up.railway.app/api/check-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          username: userData.username,
          first_name: userData.first_name,
          initData: window.Telegram.WebApp.initData // Для проверки подписи
        })
      });

      const result = await response.json();

      if (result.access) {
        setStatus('granted');
        tg.expand();
      } else {
        setStatus('denied');
        tg.showAlert("Доступ запрещен");
      }

    } catch (error) {
      console.error('Ошибка проверки доступа:', error);
      setStatus('denied');
    }
  };

  // Экран загрузки
  if (status === 'checking') {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⏳</div>
        <p style={styles.loadingText}>Проверка доступа...</p>
      </div>
    );
  }

  // Экран отказа
  if (status === 'denied') {
    return (
      <div style={styles.deniedContainer}>
        <div style={styles.deniedIcon}>🔒</div>
        <h2 style={styles.deniedTitle}>Доступ запрещен</h2>
        <p style={styles.deniedText}>
          Этот Mini App доступен только для авторизованных пользователей
        </p>
        {user && (
          <div style={styles.userInfo}>
            <p>ID: {user.id}</p>
            <p>Имя: {user.first_name}</p>
            {user.username && <p>@${user.username}</p>}
          </div>
        )}
        <div style={styles.contactInfo}>
          <p>Для получения доступа обратитесь к администратору</p>
        </div>
      </div>
    );
  }

  // Доступ разрешен - показываем основное приложение
  return children;
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    padding: '20px'
  },
  spinner: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  loadingText: {
    fontSize: '18px',
    textAlign: 'center'
  },
  deniedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    color: 'var(--tg-theme-text-color, #000000)',
    padding: '20px',
    textAlign: 'center'
  },
  deniedIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  deniedTitle: {
    fontSize: '24px',
    marginBottom: '15px',
    color: 'var(--tg-theme-destructive-text-color, #ff4444)'
  },
  deniedText: {
    fontSize: '16px',
    marginBottom: '20px',
    lineHeight: '1.5'
  },
  userInfo: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  contactInfo: {
    fontSize: '14px',
    color: 'var(--tg-theme-hint-color, #666666)'
  }
};

export default AccessControl;