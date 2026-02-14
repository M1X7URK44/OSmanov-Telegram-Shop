import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { currencyService } from './services/currencyService'

// Инициализируем сервис курса валют
currencyService.initialize().then(() => {
  console.log('Currency service initialized');
  
  // Периодически обновляем курс (каждые 5 минут)
  setInterval(() => {
    currencyService.refreshAdminRate().catch(console.error);
  }, 5 * 60 * 1000);
});

createRoot(document.getElementById('root')!).render(
    <App />
)