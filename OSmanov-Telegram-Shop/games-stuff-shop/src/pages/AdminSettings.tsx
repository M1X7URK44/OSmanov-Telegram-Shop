import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';
import { currencyService } from '../services/currencyService';

interface AdminSettingsData {
  usd_to_rub_rate: number;
  min_deposit_amount: number;
  max_deposit_amount: number;
  updated_at: string;
  updated_by: number;
}

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);
      setExchangeRate(data.usd_to_rub_rate.toString());
    } catch (err) {
      setError('Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const rate = parseFloat(exchangeRate);
    
    if (!rate || rate <= 0 || rate > 1000) {
      setError('Введите корректный курс (0-1000)');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await adminService.updateExchangeRate(rate);
      
      // Обновляем курс в CurrencyService
      currencyService.setAdminRate(rate);
      
      setSuccessMessage('Курс успешно обновлен!');
      
      // Обновляем настройки
      await loadSettings();
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Не удалось обновить курс');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setExchangeRate('90');
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Загрузка настроек...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <SettingsContainer>
      <SettingsCard>
        <SettingsHeader>
          <SettingsTitle>Настройки курса валют</SettingsTitle>
          <SettingsSubtitle>
            Установите актуальный курс USD к RUB для всех расчетов в системе
          </SettingsSubtitle>
        </SettingsHeader>

        {successMessage && (
          <SuccessMessage>
            <SuccessIcon>✓</SuccessIcon>
            {successMessage}
          </SuccessMessage>
        )}

        {error && (
          <ErrorMessage>
            <ErrorIcon>⚠️</ErrorIcon>
            {error}
          </ErrorMessage>
        )}

        <SettingsForm>
          <FormGroup>
            <InputLabel htmlFor="exchangeRate">
              Курс USD к RUB
            </InputLabel>
            <InputDescription>
              Текущий курс: <strong>{settings?.usd_to_rub_rate} ₽</strong> за 1 USD
            </InputDescription>
            <RateInputContainer>
              <RateInput
                type="number"
                id="exchangeRate"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="Введите курс"
                min="1"
                max="1000"
                step="0.01"
              />
              <CurrencyLabel>₽ за $1</CurrencyLabel>
            </RateInputContainer>
            <InputHint>
              Последнее обновление: {settings?.updated_at ? 
                new Date(settings.updated_at).toLocaleString('ru-RU') : 
                'Не обновлялся'}
            </InputHint>
          </FormGroup>

          <QuickRates>
            <QuickRateButton onClick={() => setExchangeRate('90')}>
              90 ₽
            </QuickRateButton>
            <QuickRateButton onClick={() => setExchangeRate('95')}>
              95 ₽
            </QuickRateButton>
            <QuickRateButton onClick={() => setExchangeRate('100')}>
              100 ₽
            </QuickRateButton>
            <QuickRateButton onClick={handleResetToDefault}>
              По умолчанию
            </QuickRateButton>
          </QuickRates>

          <ActionButtons>
            <SaveButton onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <ButtonSpinner />
                  Сохранение...
                </>
              ) : (
                'Сохранить курс'
              )}
            </SaveButton>
            <RefreshButton onClick={loadSettings} disabled={saving}>
              Обновить
            </RefreshButton>
          </ActionButtons>
        </SettingsForm>

        <InfoSection>
          <InfoTitle>Как это работает?</InfoTitle>
          <InfoList>
            <InfoItem>
              <InfoIcon>💰</InfoIcon>
              <InfoContent>
                <InfoItemTitle>Влияние на цены</InfoItemTitle>
                <InfoItemText>
                  Все цены в рублях будут пересчитаны по новому курсу
                </InfoItemText>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>⚡</InfoIcon>
              <InfoContent>
                <InfoItemTitle>Мгновенное обновление</InfoItemTitle>
                <InfoItemText>
                  Изменения применяются сразу для всех пользователей
                </InfoItemText>
              </InfoContent>
            </InfoItem>
            <InfoItem>
              <InfoIcon>📊</InfoIcon>
              <InfoContent>
                <InfoItemTitle>История изменений</InfoItemTitle>
                <InfoItemText>
                  Все изменения курса сохраняются в системе
                </InfoItemText>
              </InfoContent>
            </InfoItem>
          </InfoList>
        </InfoSection>
      </SettingsCard>
    </SettingsContainer>
  );
};

export default AdminSettingsPage;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styles
const SettingsContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const SettingsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(10px);
`;

const SettingsHeader = styled.div`
  margin-bottom: 30px;
`;

const SettingsTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 24px;
  margin: 0 0 8px 0;
`;

const SettingsSubtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
`;

const SettingsForm = styled.div`
  margin-bottom: 30px;
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
`;

const InputLabel = styled.label`
  display: block;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const InputDescription = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin-bottom: 12px;

  strong {
    color: #88FB47;
  }
`;

const RateInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RateInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    box-shadow: 0 0 0 2px rgba(136, 251, 71, 0.2);
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
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const CurrencyLabel = styled.span`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
`;

const InputHint = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 8px;
`;

const QuickRates = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
`;

const QuickRateButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 16px;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 14px 24px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 14px 24px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const SuccessMessage = styled.div`
  background: rgba(39, 193, 81, 0.1);
  border: 1px solid rgba(39, 193, 81, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #27C151;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const SuccessIcon = styled.span`
  font-size: 16px;
  font-weight: bold;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const ErrorIcon = styled.span`
  font-size: 16px;
`;

const InfoSection = styled.div`
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const InfoTitle = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  margin: 0 0 16px 0;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const InfoIcon = styled.div`
  font-size: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoItemTitle = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const InfoItemText = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  line-height: 1.4;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 20px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(136, 251, 71, 0.3);
  border-top: 4px solid #88FB47;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  color: #88FB47;
  font-size: 16px;
  font-family: "ChakraPetch-Regular";
`;