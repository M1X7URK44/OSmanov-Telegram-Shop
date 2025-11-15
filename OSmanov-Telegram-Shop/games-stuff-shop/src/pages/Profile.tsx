import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { userApi } from '../api/user.api';
import { useUser } from '../context/UserContext';
import { cardLinkService } from '../services/cardlink.service';
import { useCurrency } from '../hooks/useCurrency';
import { useTelegram } from '../context/TelegramContext';

const ProfilePage: React.FC = () => {
  const { user, profile, loading, error, refreshUser, updateBalance } = useUser();
  const { convertToRub, convertToUsd, formatRubles, usdToRubRate, loading: ratesLoading } = useCurrency();
  const { openLink } = useTelegram();
  
  const [addAmount, setAddAmount] = useState<string>('');
  const [updatingBalance, setUpdatingBalance] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('cardlink');

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddingBalance, setIsAddingBalance] = useState<boolean>(false);

  const [processingCardLink, setProcessingCardLink] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingOrder, setLoadingOrder] = useState<{ [key: string]: boolean }>({});

  const [convertedAmounts, setConvertedAmounts] = useState<{ [key: string]: number }>({});
  const [convertedTotalSpent, setConvertedTotalSpent] = useState<number | null>(null);

  const [convertedBalance, setConvertedBalance] = useState<number | undefined>();

  useEffect(() => {
        const convertBalance = async () => {
            if (user) {
                const rubAmount = await convertToRub(user.balance, 'USD');
                setConvertedBalance(rubAmount);
            }
        };

        convertBalance();
    }, [user?.balance, convertToRub, ratesLoading, usdToRubRate]);

  useEffect(() => {
    const shouldOpenTopUp = searchParams.get('topup') === 'true';
    const paymentStatus = searchParams.get('payment');
    
    if (shouldOpenTopUp) {
      const timer = setTimeout(() => {
        setIsAddingBalance(true);
        searchParams.delete('topup');
        setSearchParams(searchParams);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Обработка редиректа после оплаты
    if (paymentStatus === 'success') {
      alert('Платеж успешно завершен!');
      searchParams.delete('payment');
      setSearchParams(searchParams);
      refreshUser(); // Обновляем данные пользователя
    } else if (paymentStatus === 'failed') {
      alert('Платеж не прошел. Пожалуйста, попробуйте еще раз.');
      searchParams.delete('payment');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, refreshUser]);

  // Функция для конвертации всех покупок
  useEffect(() => {
    const convertPurchases = async () => {
      if (!profile?.purchases || ratesLoading) return;

      const converted: { [key: string]: number } = {};
      
      for (const purchase of profile.purchases) {
        try {
          const rubAmount = await convertToRub(purchase.amount, purchase.currency);
          converted[purchase.id] = rubAmount;
        } catch (err) {
          console.error(`Error converting purchase ${purchase.id}:`, err);
          // Используем примерный курс если конвертация не удалась
          converted[purchase.id] = purchase.amount * (usdToRubRate || 90);
        }
      }
      
      setConvertedAmounts(converted);
    };

    convertPurchases();
  }, [profile?.purchases, convertToRub, ratesLoading, usdToRubRate]);

  // Добавим useEffect для конвертации total_spent
  useEffect(() => {
    const convertTotalSpent = async () => {
      if (!user?.total_spent || ratesLoading) return;

      try {
        // Предполагаем, что total_spent в USD (как в вашей БД)
        const rubAmount = await convertToRub(user.total_spent, 'USD');
        setConvertedTotalSpent(rubAmount);
      } catch (err) {
        console.error('Error converting total spent:', err);
        // Fallback на примерный курс
        setConvertedTotalSpent(user.total_spent * (usdToRubRate || 90));
      }
    };

    convertTotalSpent();
  }, [user?.total_spent, convertToRub, ratesLoading, usdToRubRate]);

  // 🔒 Эффект для блокировки скролла при открытом модальном окне
  useEffect(() => {
    if (isAddingBalance) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingBalance]);

  // Функция для копирования информации о заказе
  const handleCopyOrderInfo = async (purchase: any) => {
    if (!purchase.custom_id) {
      alert('Информация о заказе недоступна');
      return;
    }

    setLoadingOrder(prev => ({ ...prev, [purchase.id]: true }));

    try {
      // Получаем детальную информацию о заказе из нашей базы данных
      const orderInfo = await getOrderInfoFromDatabase(purchase.custom_id);
      
      if (!orderInfo) {
        alert('Информация о заказе не найдена');
        return;
      }

      // Форматируем данные для копирования
      const textToCopy = await formatOrderInfoForCopy(orderInfo, purchase);
      
      // Копируем в буфер обмена с поддержкой мобильных устройств
      await copyToClipboard(textToCopy);
      
      // Показываем статус успешного копирования
      setCopyStatus(prev => ({ ...prev, [purchase.id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [purchase.id]: false }));
      }, 2000);

    } catch (error) {
      console.error('Error copying order info:', error);
      alert('Не удалось скопировать информацию о заказе');
    } finally {
      setLoadingOrder(prev => ({ ...prev, [purchase.id]: false }));
    }
  };

  // Универсальная функция копирования с поддержкой мобильных устройств
  const copyToClipboard = async (text: string): Promise<void> => {
    // Пытаемся использовать modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (clipboardError) {
        console.warn('Clipboard API failed, trying fallback:', clipboardError);
      }
    }
    
    // Fallback для мобильных устройств и старых браузеров
    try {
      // Создаем временный textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Делаем его невидимым
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      
      document.body.appendChild(textArea);
      
      // Выделяем и копируем
      textArea.focus();
      textArea.select();
      
      // Для мобильных устройств используем setSelectionRange
      if (navigator.userAgent.match(/iphone|ipad|ipod|android/i)) {
        textArea.setSelectionRange(0, 999999);
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('execCommand copy failed');
      }
      
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      
      // Последний вариант - показываем текст для ручного копирования
      showTextForManualCopy(text);
    }
  };

  // Функция для показа текста в модальном окне для ручного копирования
  const showTextForManualCopy = (text: string) => {
    // Создаем модальное окно с текстом
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #1a1a2e;
      border: 1px solid #88FB47;
      border-radius: 15px;
      padding: 20px;
      max-width: 90%;
      max-height: 80%;
      overflow-y: auto;
      color: white;
      font-family: system-ui;
    `;
    
    const textElement = document.createElement('pre');
    textElement.style.cssText = `
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0 0 15px 0;
      font-size: 14px;
      line-height: 1.4;
    `;
    textElement.textContent = text;
    
    const message = document.createElement('div');
    message.style.cssText = `
      color: #88FB47;
      text-align: center;
      font-size: 16px;
      margin-bottom: 15px;
      font-weight: bold;
    `;
    message.textContent = 'Выделите текст и скопируйте вручную';
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: #88FB47;
      color: #1a1a2e;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
    `;
    closeButton.textContent = 'Закрыть';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    content.appendChild(message);
    content.appendChild(textElement);
    content.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Автоматически выделяем текст на мобильных устройствах
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(textElement);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 100);
  };

  // Функция для получения информации о заказе из нашей базы данных
  const getOrderInfoFromDatabase = async (customId: string) => {
    try {
      // Используем userApi для запроса к нашему бэкенду
      const response = await userApi.getOrderInfo(customId);
      return response;
    } catch (error) {
      console.error('Error fetching order info from database:', error);
      return null;
    }
  };

  // Функция для форматирования текста для копирования
  const formatOrderInfoForCopy = async (orderInfo: any, purchase: any): Promise<string> => {
    const rubAmount = await convertToRub(purchase.amount, purchase.currency);
    const lines = [
      `🛒 Детали покупки`,
      `📦 Товар: ${purchase.service_name}`,
      `💰 Сумма: ${rubAmount} руб.`,
      `📅 Дата: ${new Date(purchase.purchase_date).toLocaleDateString('ru-RU')}`,
      `🆔 ID заказа: ${purchase.custom_id}`,
      `📊 Статус: ${purchase.status === 'completed' ? 'Завершено' : purchase.status === 'pending' ? 'В обработке' : 'Ошибка'}`,
    ];

    // Добавляем PIN коды если есть
    if (orderInfo.pins && orderInfo.pins.length > 0) {
      lines.push(`🔑 PIN коды:`);
      orderInfo.pins.forEach((pin: string, index: number) => {
        lines.push(`  ${index + 1}. ${pin}`);
      });
    }

    // Добавляем данные если есть
    if (orderInfo.data) {
      lines.push(`📝 Данные: ${orderInfo.data}`);
    }

    return lines.join('\n');
  };
  
  // Обновленная функция handleCardLinkPayment
  const handleCardLinkPayment = async () => {
    if (!addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }

    if (!user) {
      alert('Пользователь не найден');
      return;
    }

    try {
      setProcessingCardLink(true);
      setPaymentStatus('Создание платежа...');
      
      const rubAmount = Number(addAmount);
      const usdAmount = await convertToUsd(rubAmount, 'RUB');
      const amount = Number(usdAmount);
      const orderId = `balance_${user.id}_${Date.now()}`;
      
      const paymentResult = await cardLinkService.createPayment(
        rubAmount,
        orderId,
        `Пополнение баланса на ${rubAmount} ₽`,
        user.id
      );

      if (paymentResult.success && paymentResult.link_page_url && paymentResult.bill_id) {
        setPaymentStatus('Перенаправление на страницу оплаты...');
        
        // Открываем ссылку в новом окне
        // const paymentWindow = window.open(paymentResult.link_page_url, '_blank', 'width=600,height=700');
        try {
          openLink(paymentResult.link_page_url);
        } catch (error) {
          console.log(error);
          window.location.replace(paymentResult.link_page_url);
        }
        
        const paymentWindow = true;
        
        if (paymentWindow) {
          // Запускаем проверку статуса платежа
          startPaymentStatusCheck(paymentResult.bill_id, amount, rubAmount);
        } else {
          alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
          setProcessingCardLink(false);
          setPaymentStatus('');
        }
      } else {
        alert(paymentResult.error || 'Ошибка при создании платежа');
        setProcessingCardLink(false);
        setPaymentStatus('');
      }
    } catch (err) {
      console.error('Error processing CardLink payment:', err);
      alert('Ошибка при обработке платежа');
      setProcessingCardLink(false);
      setPaymentStatus('');
    }
  };

  // Упрощенная функция для проверки статуса платежа
  const startPaymentStatusCheck = (billId: string, amount: number, rubAmount: number) => {
    let checkCount = 0;
    const maxChecks = 120; // 10 минут (120 * 5 секунд)
    
    const checkInterval = setInterval(async () => {
      try {
        checkCount++;
        setPaymentStatus(`Проверка статуса платежа...`);
        
        const status = await cardLinkService.checkPaymentStatus(billId);
        
        if (status.success) {
          if (status.is_paid) {
            // Платеж успешен
            clearInterval(checkInterval);
            setProcessingCardLink(false);
            setPaymentStatus('Платеж успешно завершен!');
            
            // Обновляем баланс
            const balanceUpdate = {
              amount: amount,
              payment_method: 'cardlink',
            };
            
            if (user) {
              const response = await userApi.updateBalance(user.id, balanceUpdate);
              updateBalance(response.user.balance);
              
              // Закрываем модалку и показываем уведомление
              setTimeout(() => {
                setIsAddingBalance(false);
                setAddAmount('');
                setPaymentStatus('');
                alert(`Баланс успешно пополнен на ${rubAmount} ₽`);
              }, 1000);
            }
            
          } else if (status.is_failed) {
            // Платеж не прошел
            clearInterval(checkInterval);
            setProcessingCardLink(false);
            setPaymentStatus('Платеж не прошел');
            
            setTimeout(() => {
              setPaymentStatus('');
            }, 3000);
          }
          // Если платеж в обработке - продолжаем проверять
        }
        
        // Останавливаем проверку после максимального количества попыток
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          setProcessingCardLink(false);
          setPaymentStatus('Время проверки истекло');
          
          setTimeout(() => {
            setPaymentStatus('');
          }, 3000);
        }
        
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Проверяем каждые 5 секунд
  };

  // Обновленная функция handleAddBalance
  const handleAddBalance = async () => {
    if (selectedPayment === 'cardlink') {
      await handleCardLinkPayment();
    } else {
      // Старая логика для других методов оплаты
      if (!addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
        alert('Пожалуйста, введите корректную сумму');
        return;
      }

      try {
        setUpdatingBalance(true);
        const amount = Number(addAmount);
        
        const balanceUpdate = {
          amount: amount,
          payment_method: selectedPayment as 'bank_card' | 'yoomoney',
        };

        const userId = user?.id || 1;
        const response = await userApi.updateBalance(userId, balanceUpdate);
        
        updateBalance(response.user.balance);
        
        setIsAddingBalance(false);
        setAddAmount('');
        alert(`Баланс успешно пополнен на ${amount} ₽`);
      } catch (err) {
        console.error('Error updating balance:', err);
        alert('Ошибка при пополнении баланса');
      } finally {
        setUpdatingBalance(false);
      }
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#88FB47';
      case 'pending': return '#F89D09';
      case 'failed': return '#FF4757';
      default: return '#737591';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'pending': return 'В обработке';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // const formatCurrency = (amount: number, currency: string, purchaseId?: number) => {
  //   // Если есть конвертированная сумма в рублях, показываем её
  //   if (purchaseId && convertedAmounts[purchaseId]) {
  //     return formatRubles(convertedAmounts[purchaseId]);
  //   }
    
  //   // Иначе показываем оригинальную валюту
  //   return new Intl.NumberFormat('ru-RU', {
  //     style: 'currency',
  //     currency: currency
  //   }).format(amount);
  // };

  if (loading) {
    return (
      <ProfileContainer>
        <LoadingContainer>
          <Spinner />
          <LoadingText>Загрузка профиля...</LoadingText>
        </LoadingContainer>
      </ProfileContainer>
    );
  }

  if (error) {
    return (
      <ProfileContainer>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorText>{error}</ErrorText>
          <RetryButton onClick={refreshUser}>Попробовать снова</RetryButton>
        </ErrorContainer>
      </ProfileContainer>
    );
  }

  if (!profile || !user) {
    return (
      <ProfileContainer>
        <ErrorContainer>
          <ErrorIcon>😕</ErrorIcon>
          <ErrorText>Профиль не найден</ErrorText>
        </ErrorContainer>
      </ProfileContainer>
    );
  }

  const { purchases, totalPurchases } = profile;

  return (
    <ProfileContainer>
      {/* Header Section */}
      <ProfileHeader>
        <UserAvatar>
          <AvatarImage>
            {user.username.split(' ').map((n: string) => n[0]).join('')}
          </AvatarImage>
          <OnlineIndicator />
        </UserAvatar>
        <UserInfo>
          <UserName>{user.username}</UserName>
          <UserEmail>{user.telegram_id}</UserEmail>
          <UserJoinDate>Участник с {new Date(user.join_date).toLocaleDateString('ru-RU')}</UserJoinDate>
        </UserInfo>
      </ProfileHeader>

      {/* Balance Section */}
      <BalanceCard>
        <BalanceHeader>
          <BalanceTitle>Баланс счета</BalanceTitle>
          <BalanceActions>
            <AddBalanceButton onClick={() => setIsAddingBalance(true)}>
              <PlusIcon>+</PlusIcon>
              Пополнить
            </AddBalanceButton>
          </BalanceActions>
        </BalanceHeader>
        
        <BalanceAmount>
          <BalanceValue>{convertedBalance?.toFixed(1)}</BalanceValue>
          <CurrencySymbol>₽</CurrencySymbol>
        </BalanceAmount>
        
        <BalanceStats>
          <StatItem>
            <StatLabel>Всего потрачено</StatLabel>
            <StatValue>
              {convertedTotalSpent !== null 
                ? formatRubles(convertedTotalSpent)
                : `${user.total_spent.toLocaleString('ru-RU')} USD`
              }
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Транзакций</StatLabel>
            <StatValue>{totalPurchases}</StatValue>
          </StatItem>
        </BalanceStats>
      </BalanceCard>

      {/* Add Balance Modal */}
      {isAddingBalance && (
        <ModalOverlay onClick={() => setIsAddingBalance(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Пополнение баланса</ModalTitle>
              <CloseButton onClick={() => setIsAddingBalance(false)}>×</CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <AmountInput
                type="number"
                placeholder="Введите сумму"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="1"
                step="100"
              />
              
              <QuickAmounts>
                <QuickAmount onClick={() => setAddAmount('500')}>500 ₽</QuickAmount>
                <QuickAmount onClick={() => setAddAmount('1000')}>1 000 ₽</QuickAmount>
                <QuickAmount onClick={() => setAddAmount('5000')}>5 000 ₽</QuickAmount>
                <QuickAmount onClick={() => setAddAmount('10000')}>10 000 ₽</QuickAmount>
              </QuickAmounts>
              
              <PaymentMethods>
                {/* НОВЫЙ метод оплаты CardLink */}
                <PaymentMethod 
                  $isSelected={selectedPayment === 'cardlink'}
                  onClick={() => setSelectedPayment('cardlink')}
                >
                  <PaymentRadio 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'cardlink'}
                    onChange={() => setSelectedPayment('cardlink')}
                  />
                  <PaymentLabel>
                    <PaymentIcon>🔗</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>CardLink</PaymentName>
                      <PaymentDescription>Банковские карты, СБП</PaymentDescription>
                    </PaymentInfo>
                  </PaymentLabel>
                </PaymentMethod>
                
                {/* Существующие методы оплаты */}
                {/* <PaymentMethod 
                  $isSelected={selectedPayment === 'card'}
                  onClick={() => setSelectedPayment('card')}
                >
                  <PaymentRadio 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'card'}
                    onChange={() => setSelectedPayment('card')}
                  />
                  <PaymentLabel>
                    <PaymentIcon>💳</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>Банковская карта</PaymentName>
                      <PaymentDescription>Visa, Mastercard, МИР</PaymentDescription>
                    </PaymentInfo>
                  </PaymentLabel>
                </PaymentMethod> */}
                
                {/* <PaymentMethod 
                  $isSelected={selectedPayment === 'yoomoney'}
                  onClick={() => setSelectedPayment('yoomoney')}
                >
                  <PaymentRadio 
                    type="radio" 
                    name="payment" 
                    checked={selectedPayment === 'yoomoney'}
                    onChange={() => setSelectedPayment('yoomoney')}
                  />
                  <PaymentLabel>
                    <PaymentIcon>🤝</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>ЮMoney</PaymentName>
                      <PaymentDescription>Кошелек ЮMoney</PaymentDescription>
                    </PaymentInfo>
                  </PaymentLabel>
                </PaymentMethod> */}
              </PaymentMethods>
              
              {/* Добавляем отображение статуса платежа */}
              {paymentStatus && (
                <PaymentStatus>
                  <StatusText>{paymentStatus}</StatusText>
                  {processingCardLink && <StatusSpinner />}
                </PaymentStatus>
              )}
            </ModalBody>
            
            <ModalFooter>
              <CancelButton onClick={() => setIsAddingBalance(false)}>
                Отмена
              </CancelButton>
              <ConfirmButton 
                onClick={handleAddBalance}
                disabled={updatingBalance || processingCardLink}
              >
                {processingCardLink ? 'Подготовка платежа...' : 
                updatingBalance ? 'Пополнение...' : 
                selectedPayment === 'cardlink' ? 'Перейти к оплате' : 'Пополнить'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Recent Purchases Section */}
      <Section>
        <SectionHeader>
          <SectionTitle>История покупок</SectionTitle>
          <SectionCount>{totalPurchases} транзакций</SectionCount>
        </SectionHeader>
        
        <PurchasesList>
          {purchases.map((purchase) => (
            <PurchaseItem 
                key={purchase.id} 
                onClick={() => handleCopyOrderInfo(purchase)} 
                style={{
                  background: copyStatus[purchase.id] ? 'rgba(136, 251, 71, 0.1)' : undefined,
                  borderColor: copyStatus[purchase.id] ? 'rgba(136, 251, 71, 0.3)' : undefined
              }}>
              <PurchaseIcon>🎮</PurchaseIcon>
              
              <PurchaseInfo>
                <PurchaseName>{purchase.service_name}</PurchaseName>
                <PurchaseDate>{formatDate(purchase.purchase_date)}</PurchaseDate>
                {/* Показываем оригинальную сумму маленьким текстом */}
                <OriginalAmount>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: purchase.currency
                  }).format(purchase.amount)}
                </OriginalAmount>
              </PurchaseInfo>
              
              <PurchaseDetails>
                <PurchaseAmount>
                  {purchase.id in convertedAmounts 
                    ? formatRubles(convertedAmounts[purchase.id])
                    : 'Загрузка...'
                  }
                </PurchaseAmount>
                <PurchaseStatus $color={getStatusColor(purchase.status)}>
                  {getStatusText(purchase.status)}
                </PurchaseStatus>

                <CopyIndicator>
                  {loadingOrder[purchase.id] ? (
                    <CopySpinner />
                  ) : copyStatus[purchase.id] ? (
                    '✅ Скопировано!'
                  ) : (
                    '📋 Нажмите для копирования'
                  )}
                </CopyIndicator>
              </PurchaseDetails>
            </PurchaseItem>
          ))}
        </PurchasesList>
        
        {purchases.length === 0 && (
          <EmptyState>
            <EmptyIcon>🛒</EmptyIcon>
            <EmptyText>Пока нет покупок</EmptyText>
            <EmptySubtext>Совершите первую покупку в каталоге</EmptySubtext>
          </EmptyState>
        )}
      </Section>
    </ProfileContainer>
  );
};

export default ProfilePage;

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

const slideIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(-20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styles
const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 18px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
`;

const UserAvatar = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const AvatarImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 24px;
  font-weight: bold;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  background: #88FB47;
  border: 2px solid #1a1a2e;
  border-radius: 50%;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 24px;
  margin: 0 0 8px 0;
`;

const UserEmail = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  margin: 0 0 4px 0;
`;

const UserJoinDate = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 0;
`;

const BalanceCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 18px 12px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
  animation: ${slideIn} 0.6s ease-out;
`;

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
`;

const BalanceTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  margin: 0;
`;

const BalanceActions = styled.div`
  display: flex;
  gap: 10px;
`;

const AddBalanceButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
    animation: ${pulse} 0.5s ease-in-out;
  }
`;

const PlusIcon = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

const BalanceAmount = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const BalanceValue = styled.span`
  color: #fff;
  font-family: "Jura-Regular";
  font-size: 42px;
  font-weight: bold;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CurrencySymbol = styled.span`
  color: #88FB47;
  font-family: "Jura-Regular";
  font-size: 24px;
  font-weight: bold;
`;

const BalanceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const StatValue = styled.span`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  font-weight: 600;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 18px 12px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  margin: 0;
`;

const SectionCount = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const PurchasesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const PurchaseItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const PurchaseIcon = styled.div`
  width: 50px;
  height: 50px;
  background: rgba(136, 251, 71, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const PurchaseInfo = styled.div`
  flex: 1;
`;

const PurchaseName = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  margin: 0 0 4px 0;
`;

const PurchaseDate = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const PurchaseDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
`;

const PurchaseAmount = styled.span`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
`;

const PurchaseStatus = styled.span<{ $color: string }>`
  color: ${props => props.$color};
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  background: ${props => `${props.$color}20`};
  border-radius: 6px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const EmptyText = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const EmptySubtext = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 0;
`;


// Modal Styles
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
  z-index: 1000;
  padding: 20px;
  overflow-y: auto; /* Добавьте это */
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 40px); /* Ограничиваем высоту */
  overflow-y: auto; /* Добавляем скролл внутри модалки если нужно */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  color: #fff;
  font-size: 20px;
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

const ModalBody = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AmountInput = styled.input<{ $hasError?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${props => props.$hasError ? '#ff4757' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  padding: 16px;
  color: #fff;
  font-family: "Oxanium-Regular";
  font-size: 18px;
  width: 100%; /* ← ДОБАВИТЬ */
  box-sizing: border-box; /* ← ДОБАВИТЬ */
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ff4757' : '#88FB47'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(255, 71, 87, 0.2)' : 'rgba(136, 251, 71, 0.2)'};
  }

  &::placeholder {
    color: #737591;
  }

  /* Убираем стрелки у number input */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  /* Для Firefox */
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const QuickAmounts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const QuickAmount = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(136, 251, 71, 0.1);
    border-color: #88FB47;
  }
`;

const PaymentMethods = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PaymentMethod = styled.div<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${props => props.$isSelected ? 'rgba(136, 251, 71, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$isSelected ? '#88FB47' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const PaymentRadio = styled.input`
  margin: 0;
`;

const PaymentLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
`;

const PaymentIcon = styled.div`
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const PaymentInfo = styled.div`
  flex: 1;
`;

const PaymentName = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
`;

const PaymentDescription = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 24px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ConfirmButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }
`;

// Добавляем недостающие стили для загрузки и ошибок
const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(136, 251, 71, 0.3);
  border-top: 4px solid #88FB47;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 20px;
`;

const LoadingText = styled.span`
  color: #88FB47;
  font-size: 16px;
  font-family: "ChakraPetch-Regular";
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
  gap: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
`;

const ErrorText = styled.span`
  color: #fff;
  font-size: 18px;
  font-family: "ChakraPetch-Regular";
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }
`;

const PaymentStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: rgba(136, 251, 71, 0.1);
  border: 1px solid rgba(136, 251, 71, 0.3);
  border-radius: 10px;
  margin: 10px 0;
`;

const StatusText = styled.span`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const StatusSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(136, 251, 71, 0.3);
  border-top: 2px solid #88FB47;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;


const CopyIndicator = styled.div`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 11px;
  text-align: center;
  margin-top: 8px;
  padding: 4px 8px;
  background: rgba(136, 251, 71, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
`;

const CopySpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(136, 251, 71, 0.3);
  border-top: 2px solid #88FB47;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const OriginalAmount = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 2px;
`;