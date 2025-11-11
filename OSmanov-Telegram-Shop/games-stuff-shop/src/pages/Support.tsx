import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface SupportForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

const SupportPage: React.FC = () => {
  const [formData, setFormData] = useState<SupportForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<SupportForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<SupportForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Тема обязательна для заполнения';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Сообщение обязательно для заполнения';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Сообщение должно содержать минимум 10 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при вводе
    if (errors[name as keyof SupportForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Имитация отправки на сервер
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // В реальном приложении здесь был бы API вызов
      console.log('Form submitted:', formData);
      
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <SupportContainer>
        <SuccessMessage>
          <SuccessIcon>✓</SuccessIcon>
          <SuccessTitle>Сообщение отправлено!</SuccessTitle>
          <SuccessText>
            Ваш запрос успешно отправлен в техническую поддержку. 
            Наш специалист свяжется с вами в ближайшее время по указанному email.
          </SuccessText>
          <SuccessDetails>
            <DetailItem>
              <DetailLabel>Номер заявки:</DetailLabel>
              <DetailValue>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Время отправки:</DetailLabel>
              <DetailValue>{new Date().toLocaleString('ru-RU')}</DetailValue>
            </DetailItem>
          </SuccessDetails>
          <NewTicketButton onClick={handleNewTicket}>
            Создать новый запрос
          </NewTicketButton>
        </SuccessMessage>
      </SupportContainer>
    );
  }

  return (
    <SupportContainer>
      <SupportHeader>
        <SupportTitle>Служба поддержки</SupportTitle>
        <SupportSubtitle>
          Мы здесь чтобы помочь! Заполните форму ниже и мы ответим вам в ближайшее время.
        </SupportSubtitle>
      </SupportHeader>

      <SupportFormContainer onSubmit={handleSubmit}>
        <FormGrid>
          <FormGroup>
            <Label htmlFor="name">
              Ваше имя <Required>*</Required>
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Введите ваше имя"
              $hasError={!!errors.name}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">
              Email адрес <Required>*</Required>
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              $hasError={!!errors.email}
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="priority">
              Приоритет запроса
            </Label>
            <Select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </Select>
          </FormGroup>

          <FormGroup fullWidth>
            <Label htmlFor="subject">
              Тема сообщения <Required>*</Required>
            </Label>
            <Input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Кратко опишите проблему"
              $hasError={!!errors.subject}
            />
            {errors.subject && <ErrorText>{errors.subject}</ErrorText>}
          </FormGroup>

          <FormGroup fullWidth>
            <Label htmlFor="message">
              Подробное описание <Required>*</Required>
            </Label>
            <TextArea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Опишите вашу проблему максимально подробно..."
              rows={6}
              $hasError={!!errors.message}
            />
            {errors.message && <ErrorText>{errors.message}</ErrorText>}
            <CharCount>
              {formData.message.length} / 1000 символов
            </CharCount>
          </FormGroup>
        </FormGrid>

        <SubmitButton 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ButtonSpinner />
              Отправка...
            </>
          ) : (
            'Отправить запрос'
          )}
        </SubmitButton>

        <FormFooter>
          <FooterText>
            <Required>*</Required> Обязательные поля для заполнения
          </FooterText>
          <ResponseTime>
            ⏱ Среднее время ответа: 2-4 часа
          </ResponseTime>
        </FormFooter>
      </SupportFormContainer>

      <SupportInfo>
        <InfoCard>
          <InfoIcon>📧</InfoIcon>
          <InfoContent>
            <InfoTitle>Email поддержка</InfoTitle>
            <InfoText>support@gifts-store.com</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard>
          <InfoIcon>🕒</InfoIcon>
          <InfoContent>
            <InfoTitle>Время работы</InfoTitle>
            <InfoText>Круглосуточно, 7 дней в неделю</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard>
          <InfoIcon>📞</InfoIcon>
          <InfoContent>
            <InfoTitle>Телефон</InfoTitle>
            <InfoText>+7 (900) 123-45-67</InfoText>
          </InfoContent>
        </InfoCard>
      </SupportInfo>
    </SupportContainer>
  );
};

export default SupportPage;

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

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styles
const SupportContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SupportHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const SupportTitle = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 32px;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SupportSubtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const SupportFormContainer = styled.form`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 40px;
  backdrop-filter: blur(10px);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
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
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ff4757' : '#88FB47'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(255, 71, 87, 0.2)' : 'rgba(136, 251, 71, 0.2)'};
  }

  &::placeholder {
    color: #737591;
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #88FB47;
    box-shadow: 0 0 0 2px rgba(136, 251, 71, 0.2);
  }

  option {
    background: #1a1a2e;
    color: #fff;
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${props => props.$hasError ? '#ff4757' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 120px;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ff4757' : '#88FB47'};
    box-shadow: 0 0 0 2px ${props => props.$hasError ? 'rgba(255, 71, 87, 0.2)' : 'rgba(136, 251, 71, 0.2)'};
  }

  &::placeholder {
    color: #737591;
  }
`;

const CharCount = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
`;

const ErrorText = styled.span`
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  margin-top: 4px;
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
  width: 100%;
  margin-bottom: 20px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
    animation: ${pulse} 0.5s ease-in-out;
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

const FormFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FooterText = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const ResponseTime = styled.span`
  color: #F89D09;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  font-weight: 600;
`;

const SupportInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
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
`;

// Success Message Styles
const SuccessMessage = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.6s ease-out;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
  margin: 0 auto 24px;
  animation: ${pulse} 2s infinite;
`;

const SuccessTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 28px;
  margin: 0 0 16px 0;
`;

const SuccessText = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 32px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const SuccessDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const DetailValue = styled.span`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
`;

const NewTicketButton = styled.button`
  background: transparent;
  border: 1px solid #88FB47;
  border-radius: 10px;
  padding: 12px 24px;
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(136, 251, 71, 0.1);
    transform: translateY(-2px);
  }
`;