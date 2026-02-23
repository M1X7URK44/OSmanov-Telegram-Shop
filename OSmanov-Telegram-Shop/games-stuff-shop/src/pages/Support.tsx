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
  const [activeLegalTab, setActiveLegalTab] = useState<'privacy' | 'terms'>('privacy');

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
            <InfoText>os-projects@mail.ru</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard>
          <InfoIcon>🕒</InfoIcon>
          <InfoContent>
            <InfoTitle>Время работы</InfoTitle>
            <InfoText>Круглосуточно, 7 дней в неделю</InfoText>
          </InfoContent>
        </InfoCard>

        <InfoCard as="a" href="https://t.me/djosmanov" target="_blank" rel="noopener noreferrer">
          <InfoIcon>✈️</InfoIcon>
          <InfoContent>
            <InfoTitle>Telegram</InfoTitle>
            <InfoText>@osGIFT_support</InfoText>
          </InfoContent>
        </InfoCard>
      </SupportInfo>

      <LegalSection>
        <LegalHeader>
          <LegalTitle>Правовая информация</LegalTitle>
          <LegalSubtitle>
            Пожалуйста, ознакомьтесь с нашей политикой конфиденциальности и пользовательским соглашением
            перед использованием сервиса.
          </LegalSubtitle>
        </LegalHeader>

        <LegalTabs>
          <LegalTabButton
            type="button"
            $active={activeLegalTab === 'privacy'}
            onClick={() => setActiveLegalTab('privacy')}
          >
            Политика конфиденциальности
          </LegalTabButton>
          <LegalTabButton
            type="button"
            $active={activeLegalTab === 'terms'}
            onClick={() => setActiveLegalTab('terms')}
          >
            Пользовательское соглашение
          </LegalTabButton>
        </LegalTabs>

        <LegalContent>
          {activeLegalTab === 'privacy' ? (
            <>
              <LegalContentTitle>Политика конфиденциальности</LegalContentTitle>
              <LegalParagraph>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных
                данных пользователей сервиса <strong>osGIFT</strong>, доступного через Telegram‑бота и
                веб‑интерфейс.
              </LegalParagraph>

              <LegalSubTitle>1. Общие положения</LegalSubTitle>
              <LegalParagraph>
                1.1. Используя наш сервис, вы подтверждаете, что ознакомились с данной Политикой и
                соглашаетесь с её условиями. Если вы не согласны с условиями, пожалуйста, прекратите
                использование сервиса.
              </LegalParagraph>
              <LegalParagraph>
                1.2. Оператором персональных данных является владелец сервиса osGIFT (далее — «Администрация
                сервиса»).
              </LegalParagraph>

              <LegalSubTitle>2. Какие данные мы собираем</LegalSubTitle>
              <LegalList>
                <li>идентификатор и имя вашего Telegram‑аккаунта;</li>
                <li>контактный email (если вы указываете его в профиле или форме поддержки);</li>
                <li>история заказов, операции пополнения и списания средств;</li>
                <li>данные о выбранных товарах и игровых сервисах;</li>
                <li>техническая информация: IP‑адрес, данные о браузере, информация о девайсе.</li>
              </LegalList>

              <LegalSubTitle>3. Цели обработки данных</LegalSubTitle>
              <LegalParagraph>Мы обрабатываем ваши данные для следующих целей:</LegalParagraph>
              <LegalList>
                <li>оказание услуг по продаже цифровых товаров и игровых ценностей;</li>
                <li>ведение истории заказов и баланса;</li>
                <li>обработка обращений в службу поддержки;</li>
                <li>улучшение качества сервиса и пользовательского опыта;</li>
                <li>предотвращение мошенничества и обеспечение безопасности аккаунта.</li>
              </LegalList>

              <LegalSubTitle>4. Передача данных третьим лицам</LegalSubTitle>
              <LegalParagraph>
                Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением случаев,
                когда это необходимо:
              </LegalParagraph>
              <LegalList>
                <li>для выполнения обязательств по заказу (платёжные агрегаторы, платёжные системы);</li>
                <li>по требованию уполномоченных государственных органов в рамках действующего законодательства;</li>
                <li>для защиты прав и законных интересов Администрации сервиса.</li>
              </LegalList>

              <LegalSubTitle>5. Хранение и защита данных</LegalSubTitle>
              <LegalParagraph>
                Мы принимаем необходимые организационные и технические меры для защиты ваших персональных
                данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
              </LegalParagraph>

              <LegalSubTitle>6. Ваши права</LegalSubTitle>
              <LegalList>
                <li>получать информацию о том, какие данные о вас хранятся;</li>
                <li>запрашивать исправление неточных данных;</li>
                <li>запрашивать удаление ваших данных, если это не противоречит законодательству и
                  обязательствам по заказам;</li>
                <li>отозвать согласие на обработку персональных данных.</li>
              </LegalList>

              <LegalSubTitle>7. Контакты по вопросам конфиденциальности</LegalSubTitle>
              <LegalParagraph>
                По всем вопросам, связанным с обработкой персональных данных, вы можете связаться с нами по
                адресу: <strong>os-projects@mail.ru</strong> или через Telegram: <strong>@osGIFT_support</strong>.
              </LegalParagraph>
            </>
          ) : (
            <>
              <LegalContentTitle>Пользовательское соглашение</LegalContentTitle>
              <LegalParagraph>
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между
                пользователем и Администрацией сервиса <strong>osGIFT</strong> при использовании Telegram‑бота
                и веб‑приложения.
              </LegalParagraph>

              <LegalSubTitle>1. Принятие условий</LegalSubTitle>
              <LegalParagraph>
                1.1. Начало использования сервиса, оформление заказа, пополнение баланса или обращение в
                поддержку означает ваше полное и безоговорочное согласие с условиями настоящего Соглашения.
              </LegalParagraph>

              <LegalSubTitle>2. Описание сервиса</LegalSubTitle>
              <LegalParagraph>
                2.1. osGIFT предоставляет пользователям возможность приобретать цифровые товары, игровые
                ценности и услуги, отображаемые в интерфейсе бота и веб‑приложения.
              </LegalParagraph>

              <LegalSubTitle>3. Регистрация и аккаунт</LegalSubTitle>
              <LegalList>
                <li>
                  вы несёте ответственность за сохранность доступа к своему Telegram‑аккаунту и за все
                  действия, совершённые от его имени;
                </li>
                <li>
                  Администрация сервиса оставляет за собой право ограничить или заблокировать доступ к
                  сервису при нарушении условий Соглашения.
                </li>
              </LegalList>

              <LegalSubTitle>4. Оплата и возвраты</LegalSubTitle>
              <LegalList>
                <li>стоимость товаров и услуг указывается в интерфейсе сервиса;</li>
                <li>оплата осуществляется через доступные платёжные методы и агрегаторы;</li>
                <li>
                  цифровые товары, как правило, не подлежат возврату после их активации/получения, за
                  исключением случаев технической ошибки по вине сервиса;
                </li>
                <li>
                  при спорных ситуациях пользователь обязан обратиться в поддержку и предоставить необходимую
                  информацию (скриншоты, ID транзакции и т.п.).
                </li>
              </LegalList>

              <LegalSubTitle>5. Обязанности пользователя</LegalSubTitle>
              <LegalList>
                <li>предоставлять достоверную информацию при оформлении заказов и обращениях;</li>
                <li>не использовать сервис для мошеннических и противоправных действий;</li>
                <li>не пытаться взломать, модифицировать или нарушать работу сервиса;</li>
                <li>соблюдать правила конкретных игр и площадок, к которым относятся приобретаемые услуги.</li>
              </LegalList>

              <LegalSubTitle>6. Ответственность</LegalSubTitle>
              <LegalList>
                <li>
                  сервис не несёт ответственности за блокировки аккаунтов в играх и сторонних сервисах,
                  возникшие из‑за нарушения пользователем их правил;
                </li>
                <li>
                  сервис не отвечает за сбои в работе платёжных систем, Telegram и других внешних сервисов;
                </li>
                <li>
                  максимальный размер возможной ответственности сервиса ограничен суммой последнего оплаченного
                  заказа пользователя.
                </li>
              </LegalList>

              <LegalSubTitle>7. Изменение условий</LegalSubTitle>
              <LegalParagraph>
                Администрация сервиса вправе в одностороннем порядке изменять условия настоящего Соглашения и
                Политики конфиденциальности. Актуальная версия документов всегда доступна на странице
                поддержки.
              </LegalParagraph>

              <LegalSubTitle>8. Контакты</LegalSubTitle>
              <LegalParagraph>
                По вопросам, связанным с работой сервиса и условиями Соглашения, вы можете обратиться в
                поддержку по email <strong>os-projects@mail.ru</strong> или в Telegram: <strong>@osGIFT_support</strong>.
              </LegalParagraph>
            </>
          )}
        </LegalContent>
      </LegalSection>
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
  text-decoration: none;
  color: inherit;
  cursor: pointer;

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

const LegalSection = styled.section`
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 24px 20px 28px;
`;

const LegalHeader = styled.div`
  margin-bottom: 20px;
`;

const LegalTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  margin: 0 0 6px 0;
`;

const LegalSubtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  margin: 0;
`;

const LegalTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  margin-top: 18px;
  flex-wrap: wrap;
`;

const LegalTabButton = styled.button<{ $active?: boolean }>`
  border-radius: 999px;
  padding: 8px 14px;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  border: 1px solid ${({ $active }) => ($active ? '#88FB47' : 'rgba(255, 255, 255, 0.2)')};
  background: ${({ $active }) => ($active ? 'rgba(136, 251, 71, 0.12)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#88FB47' : '#fff')};
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    border-color: #88FB47;
    background: rgba(136, 251, 71, 0.08);
  }
`;

const LegalContent = styled.div`
  max-height: 260px;
  padding-right: 8px;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 999px;
  }
`;

const LegalContentTitle = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  margin: 0 0 10px 0;
`;

const LegalSubTitle = styled.h4`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 16px 0 6px 0;
`;

const LegalParagraph = styled.p`
  color: #b4b6d3;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  line-height: 1.55;
  margin: 0 0 6px 0;
`;

const LegalList = styled.ul`
  color: #b4b6d3;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 4px 18px;
  padding: 0;

  li {
    margin-bottom: 4px;
  }
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