import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { fragmentService } from '../services/fragment.service';
import { useUser } from '../context/UserContext';
import { useCurrency } from '../hooks/useCurrency';
import { useTelegram } from '../context/TelegramContext';

type PurchaseType = 'stars' | 'premium';
type RecipientType = 'self' | 'other';

interface StarsFormData {
  username: string;
  quantity: number;
  recipientType: RecipientType;
}

interface PremiumFormData {
  username: string;
  months: number;
  recipientType: RecipientType;
}

const TelegramStarsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateBalance } = useUser();
  const { convertToRub, formatRubles, loading: ratesLoading } = useCurrency();
  const { user: telegramUser } = useTelegram();
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('stars');
  const [starsData, setStarsData] = useState<StarsFormData>({
    username: '',
    quantity: 50,
    recipientType: 'self'
  });
  const [premiumData, setPremiumData] = useState<PremiumFormData>({
    username: '',
    months: 3,
    recipientType: 'self'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; quantity?: string; months?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [starPriceRub, setStarPriceRub] = useState<number | null>(null);
  const [premiumPriceRub, setPremiumPriceRub] = useState<number | null>(null);
  const [premium3mPriceRub, setPremium3mPriceRub] = useState<number | null>(null);
  const [premium6mPriceRub, setPremium6mPriceRub] = useState<number | null>(null);
  const [premium12mPriceRub, setPremium12mPriceRub] = useState<number | null>(null);
  const [userBalanceRub, setUserBalanceRub] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmType, setConfirmType] = useState<PurchaseType>('stars');
  const [confirmError, setConfirmError] = useState<string>('');

  // Загружаем публичные настройки (курс и цены)
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await fetch('/api/admin/settings/public');
        if (response.ok) {
          const result = await response.json();
          const data = result.data || {};
          setStarPriceRub(data.telegram_star_price_rub ?? 1.0);
          setPremiumPriceRub(data.telegram_premium_price_rub ?? 399.0);
          setPremium3mPriceRub(data.telegram_premium_3m_price_rub ?? null);
          setPremium6mPriceRub(data.telegram_premium_6m_price_rub ?? null);
          setPremium12mPriceRub(data.telegram_premium_12m_price_rub ?? null);
        } else {
          setStarPriceRub(1.0);
          setPremiumPriceRub(399.0);
          setPremium3mPriceRub(null);
          setPremium6mPriceRub(null);
          setPremium12mPriceRub(null);
        }
      } catch {
        setStarPriceRub(1.0);
        setPremiumPriceRub(399.0);
        setPremium3mPriceRub(null);
        setPremium6mPriceRub(null);
        setPremium12mPriceRub(null);
      } finally {
        // ignore
      }
    };

    loadPricing();
  }, []);

  // Автоподстановка username при выборе "для себя"
  useEffect(() => {
    if (starsData.recipientType === 'self' && telegramUser?.username) {
      setStarsData(prev => ({ ...prev, username: `@${telegramUser.username}` }));
    } else if (starsData.recipientType === 'other') {
      setStarsData(prev => ({ ...prev, username: '' }));
    }
  }, [starsData.recipientType, telegramUser?.username]);

  useEffect(() => {
    if (premiumData.recipientType === 'self' && telegramUser?.username) {
      setPremiumData(prev => ({ ...prev, username: `@${telegramUser.username}` }));
    } else if (premiumData.recipientType === 'other') {
      setPremiumData(prev => ({ ...prev, username: '' }));
    }
  }, [premiumData.recipientType, telegramUser?.username]);

  // Конвертируем баланс пользователя в рубли
  useEffect(() => {
    const convertBalance = async () => {
      if (!user || ratesLoading) return;
      try {
        const rub = await convertToRub(user.balance, 'USD');
        setUserBalanceRub(rub);
      } catch {
        setUserBalanceRub(user.balance * 90);
      }
    };
    convertBalance();
  }, [user, convertToRub, ratesLoading]);

  const getStarsTotalRub = () => {
    if (!starPriceRub) return null;
    return starPriceRub * starsData.quantity;
  };

  const getPremiumTotalRub = () => {
    if (premiumData.months === 3 && premium3mPriceRub) {
      return premium3mPriceRub;
    } else if (premiumData.months === 6 && premium6mPriceRub) {
      return premium6mPriceRub;
    } else if (premiumData.months === 12 && premium12mPriceRub) {
      return premium12mPriceRub;
    } else if (premiumPriceRub) {
      return premiumPriceRub * premiumData.months;
    }
    return null;
  };

  const validateStarsForm = (): boolean => {
    const newErrors: { username?: string; quantity?: string } = {};

    if (starsData.recipientType === 'other') {
      if (!starsData.username.trim()) {
        newErrors.username = 'Введите @username';
      } else if (!starsData.username.trim().startsWith('@')) {
        newErrors.username = 'Username должен начинаться с @';
      }
    }

    if (!starsData.quantity || starsData.quantity < 50) {
      newErrors.quantity = 'Минимальное количество: 50 звёзд';
    } else if (starsData.quantity > 100000) {
      newErrors.quantity = 'Максимальное количество: 100,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePremiumForm = (): boolean => {
    const newErrors: { username?: string; months?: string } = {};

    if (premiumData.recipientType === 'other') {
      if (!premiumData.username.trim()) {
        newErrors.username = 'Введите @username';
      } else if (!premiumData.username.trim().startsWith('@')) {
        newErrors.username = 'Username должен начинаться с @';
      }
    }

    if (!premiumData.months || ![3, 6, 12].includes(premiumData.months)) {
      newErrors.months = 'Выберите 3, 6 или 12 месяцев';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStarsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStarsForm()) {
      return;
    }

    setConfirmError('');

    const totalRub = getStarsTotalRub();
    if (totalRub && userBalanceRub !== null && totalRub > userBalanceRub) {
      setConfirmError('Недостаточно средств на балансе для покупки указанного количества звезд.');
      return;
    }

    setConfirmType('stars');
    setConfirmOpen(true);
  };

  const handlePremiumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePremiumForm()) {
      return;
    }

    setConfirmError('');

    const totalRub = getPremiumTotalRub();
    if (totalRub && userBalanceRub !== null && totalRub > userBalanceRub) {
      setConfirmError('Недостаточно средств на балансе для покупки Telegram Premium.');
      return;
    }

    setConfirmType('premium');
    setConfirmOpen(true);
  };

  const performStarsPurchase = async () => {
    // Сразу показываем успешное сообщение и закрываем модалку
    setConfirmOpen(false);
    setConfirmError('');
    setSuccessMessage('✅ Вы успешно приобрели звёзды! Они придут через 1–2 минуты. Спасибо!');
    setInfoMessage('🌟 Звезды будут начислены в течение 1–2 минут.');
    
    // Сохраняем данные для API вызова
    const usernameToSend = starsData.username.trim();
    const quantityToSend = starsData.quantity;
    
    // Очищаем форму
    setStarsData({ username: '', quantity: 50, recipientType: 'self' });
    
    // Автоматически скрываем сообщения через 5 секунд
    setTimeout(() => {
      setSuccessMessage('');
      setInfoMessage('');
    }, 5000);

    // Выполняем API вызов в фоне
    setIsSubmitting(true);
    try {
      const response = await fragmentService.createStarsOrder(
        usernameToSend,
        quantityToSend
      );

      if (response.success) {
        if (response.new_balance_usd !== undefined) {
          updateBalance(response.new_balance_usd);
        }
      } else {
        // Если ошибка, показываем её, но не перезаписываем успешное сообщение сразу
        console.error('Error creating stars order:', response.error);
        setTimeout(() => {
          setConfirmError(response.error || 'Ошибка при создании заказа на звезды');
        }, 6000);
      }
    } catch (error: any) {
      console.error('Error creating stars order:', error);
      setTimeout(() => {
        setConfirmError(error.message || 'Ошибка при создании заказа на звезды');
      }, 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const performPremiumPurchase = async () => {
    // Сразу показываем успешное сообщение и закрываем модалку
    setConfirmOpen(false);
    setConfirmError('');
    setSuccessMessage('✅ Вы успешно приобрели Telegram Premium! Он будет активирован через 1–2 минуты. Спасибо!');
    setInfoMessage('💎 Telegram Premium будет активирован в течение 1–2 минут.');
    
    // Сохраняем данные для API вызова
    const usernameToSend = premiumData.username.trim();
    const monthsToSend = premiumData.months;
    
    // Очищаем форму
    setPremiumData({ username: '', months: 3, recipientType: 'self' });
    
    // Автоматически скрываем сообщения через 5 секунд
    setTimeout(() => {
      setSuccessMessage('');
      setInfoMessage('');
    }, 5000);

    // Выполняем API вызов в фоне
    setIsSubmitting(true);
    try {
      const response = await fragmentService.createPremiumOrder(
        usernameToSend,
        monthsToSend
      );

      if (response.success) {
        if (response.new_balance_usd !== undefined) {
          updateBalance(response.new_balance_usd);
        }
      } else {
        // Если ошибка, показываем её, но не перезаписываем успешное сообщение сразу
        console.error('Error creating premium order:', response.error);
        setTimeout(() => {
          setConfirmError(response.error || 'Ошибка при создании заказа на премиум');
        }, 6000);
      }
    } catch (error: any) {
      console.error('Error creating premium order:', error);
      setTimeout(() => {
        setConfirmError(error.message || 'Ошибка при создании заказа на премиум');
      }, 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: PurchaseType
  ) => {
    const { name, value } = e.target;
    
    if (type === 'stars') {
      if (name === 'quantity') {
        // Позволяем пустое значение для очистки поля
        if (value === '') {
          setStarsData(prev => ({ ...prev, quantity: 0 }));
        } else {
          const numValue = parseInt(value) || 0;
          // Применяем минимум только при потере фокуса или при вводе значения меньше 50
          setStarsData(prev => ({
            ...prev,
            quantity: numValue
          }));
        }
      } else {
        setStarsData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setPremiumData(prev => ({
        ...prev,
        [name]: name === 'months' ? parseInt(value) || 0 : value
      }));
    }
    
    // Очищаем ошибки при вводе
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleQuantityBlur = () => {
    // При потере фокуса применяем минимум 50
    if (starsData.quantity < 50) {
      setStarsData(prev => ({ ...prev, quantity: 50 }));
    }
  };

  const handleRecipientTypeChange = (type: RecipientType, purchaseType: PurchaseType) => {
    if (purchaseType === 'stars') {
      setStarsData(prev => ({ ...prev, recipientType: type }));
      if (type === 'self' && telegramUser?.username) {
        setStarsData(prev => ({ ...prev, username: `@${telegramUser.username}` }));
      } else if (type === 'other') {
        setStarsData(prev => ({ ...prev, username: '' }));
      }
    } else {
      setPremiumData(prev => ({ ...prev, recipientType: type }));
      if (type === 'self' && telegramUser?.username) {
        setPremiumData(prev => ({ ...prev, username: `@${telegramUser.username}` }));
      } else if (type === 'other') {
        setPremiumData(prev => ({ ...prev, username: '' }));
      }
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/')}>
          ← Назад
        </BackButton>
        <Title>🌟 osSTARS | Звезды и Премиум</Title>
        <Subtitle>
          Самые выгодные цены на Telegram Stars и Telegram Premium
        </Subtitle>
      </Header>

      <TabsContainer>
        <Tab
          $active={purchaseType === 'stars'}
          onClick={() => {
            setPurchaseType('stars');
            setErrors({});
            setSuccessMessage('');
          }}
        >
          ⭐ Звезды
        </Tab>
        <Tab
          $active={purchaseType === 'premium'}
          onClick={() => {
            setPurchaseType('premium');
            setErrors({});
            setSuccessMessage('');
          }}
        >
          💎 Премиум
        </Tab>
      </TabsContainer>

      {successMessage && (
        <SuccessMessage>
          {successMessage}
        </SuccessMessage>
      )}

      {infoMessage && (
        <InfoMessage>
          {infoMessage}
        </InfoMessage>
      )}

      {confirmError && (
        <ErrorBanner>
          {confirmError}
        </ErrorBanner>
      )}

      {purchaseType === 'stars' ? (
        <FormContainer>
          <FormCard>
            <FormHeader>
              <FormIcon>⭐</FormIcon>
              <FormTitle>Купить Telegram Stars</FormTitle>
              <FormDescription>
                Выберите получателя и количество звезд
              </FormDescription>
            </FormHeader>

            <Form onSubmit={handleStarsSubmit}>
              <FormGroup>
                <Label>Купить для</Label>
                <RecipientTypeContainer>
                  <RecipientTypeButton
                    type="button"
                    $active={starsData.recipientType === 'self'}
                    onClick={() => handleRecipientTypeChange('self', 'stars')}
                  >
                    Для себя
                  </RecipientTypeButton>
                  <RecipientTypeButton
                    type="button"
                    $active={starsData.recipientType === 'other'}
                    onClick={() => handleRecipientTypeChange('other', 'stars')}
                  >
                    Другому
                  </RecipientTypeButton>
                </RecipientTypeContainer>
              </FormGroup>

              {starsData.recipientType === 'other' && (
                <FormGroup>
                  <Label htmlFor="stars-username">
                    @username получателя <Required>*</Required>
                  </Label>
                  <Input
                    type="text"
                    id="stars-username"
                    name="username"
                    value={starsData.username}
                    onChange={(e) => handleInputChange(e, 'stars')}
                    placeholder="@username"
                    $hasError={!!errors.username}
                  />
                  {errors.username && <ErrorText>{errors.username}</ErrorText>}
                </FormGroup>
              )}

              <FormGroup>
                <Label htmlFor="stars-quantity">
                  Количество звезд <Required>*</Required>
                </Label>
                <Input
                  type="number"
                  id="stars-quantity"
                  name="quantity"
                  value={starsData.quantity || ''}
                  onChange={(e) => handleInputChange(e, 'stars')}
                  onBlur={handleQuantityBlur}
                  placeholder="50"
                  min="50"
                  max="100000"
                  $hasError={!!errors.quantity}
                />
                {errors.quantity && <ErrorText>{errors.quantity}</ErrorText>}
                <MinAmountHint>Минимальное количество: 50 звёзд</MinAmountHint>
                <QuickAmounts>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 50}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 50 }))}
                  >
                    50 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 75}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 75 }))}
                  >
                    75 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 100}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 100 }))}
                  >
                    100 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 150}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 150 }))}
                  >
                    150 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 250}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 250 }))}
                  >
                    250 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 350}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 350 }))}
                  >
                    350 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 500}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 500 }))}
                  >
                    500 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 750}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 750 }))}
                  >
                    750 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 1000}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 1000 }))}
                  >
                    1,000 ⭐
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={starsData.quantity === 1500}
                    onClick={() => setStarsData(prev => ({ ...prev, quantity: 1500 }))}
                  >
                    1,500 ⭐
                  </QuickAmount>
                </QuickAmounts>

                {starPriceRub && (
                  <PriceInfo>
                    <PriceLine>
                      <span>Цена за 1 ⭐:</span>
                      <strong>{formatRubles(starPriceRub)}</strong>
                    </PriceLine>
                    <PriceLine>
                      <span>Итого:</span>
                      <strong>
                        {getStarsTotalRub() !== null ? formatRubles(getStarsTotalRub()!) : '...'}
                      </strong>
                    </PriceLine>
                    {userBalanceRub !== null && (
                      <PriceLine>
                        <span>Ваш баланс:</span>
                        <strong>{formatRubles(userBalanceRub)}</strong>
                      </PriceLine>
                    )}
                  </PriceInfo>
                )}
              </FormGroup>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <ButtonSpinner />
                    Создание заказа...
                  </>
                ) : (
                  <>
                    ⭐ Купить звезды
                  </>
                )}
              </SubmitButton>
            </Form>
          </FormCard>
        </FormContainer>
      ) : (
        <FormContainer>
          <FormCard>
            <FormHeader>
              <FormIcon>💎</FormIcon>
              <FormTitle>Купить Telegram Premium</FormTitle>
              <FormDescription>
                Выберите получателя и период подписки
              </FormDescription>
            </FormHeader>

            <Form onSubmit={handlePremiumSubmit}>
              <FormGroup>
                <Label>Купить для</Label>
                <RecipientTypeContainer>
                  <RecipientTypeButton
                    type="button"
                    $active={premiumData.recipientType === 'self'}
                    onClick={() => handleRecipientTypeChange('self', 'premium')}
                  >
                    Для себя
                  </RecipientTypeButton>
                  <RecipientTypeButton
                    type="button"
                    $active={premiumData.recipientType === 'other'}
                    onClick={() => handleRecipientTypeChange('other', 'premium')}
                  >
                    Другому
                  </RecipientTypeButton>
                </RecipientTypeContainer>
              </FormGroup>

              {premiumData.recipientType === 'other' && (
                <FormGroup>
                  <Label htmlFor="premium-username">
                    @username получателя <Required>*</Required>
                  </Label>
                  <Input
                    type="text"
                    id="premium-username"
                    name="username"
                    value={premiumData.username}
                    onChange={(e) => handleInputChange(e, 'premium')}
                    placeholder="@username"
                    $hasError={!!errors.username}
                  />
                  {errors.username && <ErrorText>{errors.username}</ErrorText>}
                </FormGroup>
              )}

              <FormGroup>
                <Label htmlFor="premium-months">
                  Количество месяцев <Required>*</Required>
                </Label>
                <QuickAmounts>
                  <QuickAmount 
                    type="button"
                    $active={premiumData.months === 3}
                    onClick={() => setPremiumData(prev => ({ ...prev, months: 3 }))}
                  >
                    3 месяца
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={premiumData.months === 6}
                    onClick={() => setPremiumData(prev => ({ ...prev, months: 6 }))}
                  >
                    6 месяцев
                  </QuickAmount>
                  <QuickAmount 
                    type="button"
                    $active={premiumData.months === 12}
                    onClick={() => setPremiumData(prev => ({ ...prev, months: 12 }))}
                  >
                    1 год
                  </QuickAmount>
                </QuickAmounts>

                {getPremiumTotalRub() !== null && (
                  <PriceInfo>
                    <PriceLine>
                      <span>Итого:</span>
                      <strong>
                        {formatRubles(getPremiumTotalRub()!)}
                      </strong>
                    </PriceLine>
                    {userBalanceRub !== null && (
                      <PriceLine>
                        <span>Ваш баланс:</span>
                        <strong>{formatRubles(userBalanceRub)}</strong>
                      </PriceLine>
                    )}
                  </PriceInfo>
                )}
              </FormGroup>

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <ButtonSpinner />
                    Создание заказа...
                  </>
                ) : (
                  <>
                    💎 Купить Premium
                  </>
                )}
              </SubmitButton>
            </Form>
          </FormCard>
        </FormContainer>
      )}

      <InfoSection>
        <InfoCard>
          <InfoIcon>⚡</InfoIcon>
          <InfoContent>
            <InfoTitle>Мгновенная доставка</InfoTitle>
            <InfoText>Звезды и Premium доставляются мгновенно после оплаты</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard>
          <InfoIcon>🛡️</InfoIcon>
          <InfoContent>
            <InfoTitle>Безопасно</InfoTitle>
            <InfoText>Все транзакции защищены и проходят через официальный Fragment API</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard>
          <InfoIcon>💰</InfoIcon>
          <InfoContent>
            <InfoTitle>Выгодные цены</InfoTitle>
            <InfoText>Самые низкие цены на рынке на Telegram Stars и Premium</InfoText>
          </InfoContent>
        </InfoCard>
      </InfoSection>

      {confirmOpen && (
        <ConfirmOverlay>
          <ConfirmModal>
            <ConfirmTitle>Подтвердите покупку</ConfirmTitle>
            <ConfirmText>
              {confirmType === 'stars' ? (
                <>
                  Вы уверены, что хотите купить{' '}
                  <strong>{starsData.quantity} ⭐</strong> для{' '}
                  <strong>{starsData.username}</strong> на сумму{' '}
                  <strong>
                    {getStarsTotalRub() !== null ? formatRubles(getStarsTotalRub()!) : '...'}
                  </strong>
                  ?
                </>
              ) : (
                <>
                  Вы уверены, что хотите купить Telegram Premium на{' '}
                  <strong>{premiumData.months === 12 ? '1 год' : `${premiumData.months} ${premiumData.months === 3 ? 'месяца' : 'месяцев'}`}</strong>{' '}
                  для <strong>{premiumData.username}</strong> на сумму{' '}
                  <strong>
                    {getPremiumTotalRub() !== null ? formatRubles(getPremiumTotalRub()!) : '...'}
                  </strong>
                  ?
                </>
              )}
            </ConfirmText>
            <ConfirmButtons>
              <CancelButton type="button" onClick={() => { setConfirmOpen(false); setConfirmError(''); }}>
                Нет, отмена
              </CancelButton>
              <ConfirmButtonStyled
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (confirmType === 'stars') {
                    performStarsPurchase();
                  } else {
                    performPremiumPurchase();
                  }
                }}
              >
                {isSubmitting ? 'Обработка...' : 'Да, купить'}
              </ConfirmButtonStyled>
            </ConfirmButtons>
          </ConfirmModal>
        </ConfirmOverlay>
      )}
    </Container>
  );
};

export default TelegramStarsPage;

// Animations
const fadeIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styles
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 20px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #88FB47;
  }
`;

const Title = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 32px;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 6px;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  background: ${props => props.$active ? 'linear-gradient(135deg, #88FB47 0%, #27C151 100%)' : 'transparent'};
  border: none;
  border-radius: 10px;
  padding: 14px 20px;
  color: ${props => props.$active ? '#1a1a2e' : '#fff'};
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #88FB47 0%, #27C151 100%)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const SuccessMessage = styled.div`
  background: rgba(39, 193, 81, 0.2);
  border: 1px solid rgba(39, 193, 81, 0.5);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  color: #27C151;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  text-align: center;
  animation: ${fadeIn} 0.3s ease-out;
`;

const InfoMessage = styled.div`
  background: rgba(136, 251, 71, 0.12);
  border: 1px solid rgba(136, 251, 71, 0.4);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #88fb47;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  text-align: center;
`;

const ErrorBanner = styled.div`
  background: rgba(255, 71, 87, 0.12);
  border: 1px solid rgba(255, 71, 87, 0.4);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  text-align: center;
`;

const FormContainer = styled.div`
  margin-bottom: 30px;
`;

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const FormIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const FormTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 24px;
  margin: 0 0 8px 0;
`;

const FormDescription = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  display: flex;
  align-items: center;
`;

const Required = styled.span`
  color: #ff4757;
  margin-left: 4px;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${props => props.$hasError ? '#ff4757' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  padding: 14px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ff4757' : '#88FB47'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(255, 71, 87, 0.2)' : 'rgba(136, 251, 71, 0.2)'};
  }

  &::placeholder {
    color: #737591;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const ErrorText = styled.span`
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const MinAmountHint = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 4px;
`;

const RecipientTypeContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const RecipientTypeButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  background: ${props => props.$active ? 'rgba(136, 251, 71, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? '#88FB47' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 12px;
  color: ${props => props.$active ? '#88FB47' : '#fff'};
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? 'rgba(136, 251, 71, 0.2)' : 'rgba(136, 251, 71, 0.1)'};
    border-color: #88FB47;
  }
`;

const QuickAmounts = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const QuickAmount = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 'rgba(136, 251, 71, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? '#88FB47' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 10px;
  color: ${props => props.$active ? '#88FB47' : '#fff'};
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? 'rgba(136, 251, 71, 0.2)' : 'rgba(136, 251, 71, 0.1)'};
    border-color: #88FB47;
  }
`;

const PriceInfo = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PriceLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  color: #b4b6d3;

  strong {
    color: #fff;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 16px 32px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ConfirmOverlay = styled.div`
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
  z-index: 1000;
  padding: 20px;
`;

const ConfirmModal = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 18px;
  padding: 22px 20px 18px;
  max-width: 420px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
`;

const ConfirmTitle = styled.h3`
  margin: 0 0 10px 0;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
`;

const ConfirmText = styled.p`
  margin: 0 0 18px 0;
  color: #b4b6d3;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  line-height: 1.5;

  strong {
    color: #fff;
  }
`;

const ConfirmButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const CancelButton = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
`;

const ConfirmButtonStyled = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  color: #1a1a2e;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(136, 251, 71, 0.35);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const InfoSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const InfoIcon = styled.div`
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(136, 251, 71, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  margin: 0 0 4px 0;
`;

const InfoText = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 0;
  line-height: 1.4;
`;
