import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { steamApiService, type CurrencyRatesResponse } from '../services/steamApi.service';
import { orderService } from '../services/orderService';
import { useUser } from '../context/UserContext';
import { useCurrency } from '../hooks/useCurrency';

interface SteamTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SteamTopUpModal: React.FC<SteamTopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [steamLogin, setSteamLogin] = useState('');
  const [amount, setAmount] = useState('');
  const [currencyRates, setCurrencyRates] = useState<CurrencyRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useUser();
  const { usdToRubRate, formatRubles } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      loadCurrencyRates();
    } else {
      // Сбрасываем состояние при закрытии
      setSteamLogin('');
      setAmount('');
      setError(null);
      setCurrencyRates(null);
    }
  }, [isOpen]);

  const loadCurrencyRates = async () => {
    try {
      setRatesLoading(true);
      const rates = await steamApiService.getCurrencyRates();
      setCurrencyRates(rates);
    } catch (err) {
      console.error('Error loading currency rates:', err);
      setError('Не удалось загрузить курсы валют');
    } finally {
      setRatesLoading(false);
    }
  };

  const calculateAmounts = () => {
    if (!amount || !currencyRates) return null;

    const usdAmount = parseFloat(amount);
    if (isNaN(usdAmount) || usdAmount <= 0) return null;

    return {
      rub: steamApiService.calculateAmountInCurrency(usdAmount, currencyRates['rub/usd']),
      kzt: steamApiService.calculateAmountInCurrency(usdAmount, currencyRates['kzt/usd']),
      uah: steamApiService.calculateAmountInCurrency(usdAmount, currencyRates['uah/usd']),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!steamLogin.trim()) {
      setError('Пожалуйста, укажите Steam Login');
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError('Пожалуйста, укажите корректную сумму');
      return;
    }

    if (!user) {
      setError('Необходима авторизация');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Конвертируем сумму из USD в рубли по курсу из админ-панели
      const exchangeRate = usdToRubRate || 90; // Fallback на 90, если курс не загружен
      const priceInRubles = amountValue * exchangeRate;
      
      console.log('💰 Steam TopUp - Creating order:', {
        usd_amount: amountValue,
        exchange_rate: exchangeRate,
        price_in_rubles: priceInRubles,
        user_id: user.id,
        user_balance: user.balance
      });
      
      // Создаем заказ (используем конвертированную сумму в рублях)
      const createResponse = await orderService.createOrder({
        service_id: 1,
        quantity: amountValue, // Количество в USD (для API)
        data: steamLogin.trim(),
        user_id: user.id,
        service_name: 'Steam Wallet Top-Up',
        price: priceInRubles, // Цена в рублях для списания с баланса
      });
      
      console.log('✅ Order created:', createResponse);

      // Оплачиваем заказ
      await orderService.payOrder({
        custom_id: createResponse.custom_id,
        user_id: user.id,
      });

      // Обновляем баланс пользователя
      await refreshUser();

      // Закрываем модальное окно и вызываем callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Пополнение Steam Wallet успешно оформлено!');
    } catch (err) {
      console.error('Error processing Steam top-up:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const amounts = calculateAmounts();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Пополнение Steam Wallet</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Укажите Ваш Steam Login</Label>
            <Input
              type="text"
              value={steamLogin}
              onChange={(e) => setSteamLogin(e.target.value)}
              placeholder="Введите ваш Steam Login"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Укажите сумму для пополнения (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            {amount && usdToRubRate && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <PriceInfo>
                К оплате: <PriceAmount>{formatRubles(parseFloat(amount) * usdToRubRate)}</PriceAmount>
              </PriceInfo>
            )}
          </FormGroup>

          {amount && amounts && (
            <CurrencyTable>
              <TableHeader>
                <TableHeaderCell>Валюта</TableHeaderCell>
                <TableHeaderCell>Сумма</TableHeaderCell>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>RUB</TableCell>
                  <TableCell>{amounts.rub.toFixed(2)} ₽</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>KZT</TableCell>
                  <TableCell>{amounts.kzt.toFixed(2)} ₸</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>UAH</TableCell>
                  <TableCell>{amounts.uah.toFixed(2)} ₴</TableCell>
                </TableRow>
              </TableBody>
            </CurrencyTable>
          )}

          {ratesLoading && (
            <LoadingText>Загрузка курсов валют...</LoadingText>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <SubmitButton type="submit" disabled={loading || ratesLoading}>
            {loading ? 'Обработка...' : 'Подтвердить'}
          </SubmitButton>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SteamTopUpModal;

// Стили
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  font-family: "ChakraPetch-Regular";
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(136, 251, 71, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const CurrencyTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background: rgba(136, 251, 71, 0.1);
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid rgba(136, 251, 71, 0.2);
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const LoadingText = styled.div`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  text-align: center;
  padding: 12px;
`;

const ErrorMessage = styled.div`
  color: #ff3b3b;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 59, 59, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 59, 59, 0.3);
`;

const PriceInfo = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 4px;
`;

const PriceAmount = styled.span`
  color: #88FB47;
  font-weight: 600;
  font-size: 14px;
`;

const SubmitButton = styled.button`
  background: #88FB47;
  color: #1a1a2e;
  border: none;
  border-radius: 10px;
  padding: 14px 24px;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: #7ae03d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(136, 251, 71, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
