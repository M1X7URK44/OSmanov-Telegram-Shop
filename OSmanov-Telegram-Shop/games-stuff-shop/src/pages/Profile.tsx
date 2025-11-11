import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { userApi } from '../api/user.api';
import { useUser } from '../context/UserContext';
import type { BalanceUpdateRequest } from '../types/api.types';

const ProfilePage: React.FC = () => {
  const { user, profile, loading, error, refreshUser, updateBalance } = useUser();
  
  const [addAmount, setAddAmount] = useState<string>('');
  const [updatingBalance, setUpdatingBalance] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('card');

  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddingBalance, setIsAddingBalance] = useState<boolean>(false);

  useEffect(() => {
    const shouldOpenTopUp = searchParams.get('topup') === 'true';
    if (shouldOpenTopUp) {
      const timer = setTimeout(() => {
        setIsAddingBalance(true);
        searchParams.delete('topup');
        setSearchParams(searchParams);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

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

  const handleAddBalance = async () => {
    if (!addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }

    try {
      setUpdatingBalance(true);
      const amount = Number(addAmount);
      
      const balanceUpdate: BalanceUpdateRequest = {
        amount: amount,
        payment_method: 'bank_card'
      };

      const userId = 1; // Временно используем ID 1
      const response = await userApi.updateBalance(userId, balanceUpdate);
      
      // Обновляем баланс через контекст
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

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
          <UserEmail>{user.email}</UserEmail>
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
          <BalanceValue>{user.balance.toLocaleString('ru-RU')}</BalanceValue>
          <CurrencySymbol>₽</CurrencySymbol>
        </BalanceAmount>
        
        <BalanceStats>
          <StatItem>
            <StatLabel>Всего потрачено</StatLabel>
            <StatValue>{user.total_spent.toLocaleString('ru-RU')} ₽</StatValue>
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
                <PaymentMethod 
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
                </PaymentMethod>
                
                <PaymentMethod 
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
                </PaymentMethod>
              </PaymentMethods>
            </ModalBody>
            
            <ModalFooter>
              <CancelButton onClick={() => setIsAddingBalance(false)}>
                Отмена
              </CancelButton>
              <ConfirmButton 
                onClick={handleAddBalance}
                disabled={updatingBalance}
              >
                {updatingBalance ? 'Пополнение...' : 'Пополнить'}
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
            <PurchaseItem key={purchase.id}>
              <PurchaseIcon>🎮</PurchaseIcon>
              
              <PurchaseInfo>
                <PurchaseName>{purchase.service_name}</PurchaseName>
                <PurchaseDate>{formatDate(purchase.purchase_date)}</PurchaseDate>
              </PurchaseInfo>
              
              <PurchaseDetails>
                <PurchaseAmount>
                  {formatCurrency(purchase.amount, purchase.currency)}
                </PurchaseAmount>
                <PurchaseStatus $color={getStatusColor(purchase.status)}>
                  {getStatusText(purchase.status)}
                </PurchaseStatus>
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