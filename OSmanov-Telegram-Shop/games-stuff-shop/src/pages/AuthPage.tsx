import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { telegramAuthService } from '../services/telegramAuth.service';
import { useUser } from '../context/UserContext';

type AuthTab = 'phone' | 'email';
type AuthStep = 'input' | 'code';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useUser();
  const [tab, setTab] = useState<AuthTab>('phone');
  const [step, setStep] = useState<AuthStep>('input');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (tab === 'phone') {
        if (!phone.trim()) {
          setError('Введите номер телефона');
          return;
        }
        await telegramAuthService.sendPhoneCode(phone.trim());
      } else {
        if (!email.trim()) {
          setError('Введите email');
          return;
        }
        await telegramAuthService.sendEmailCode(email.trim());
      }
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const params = tab === 'phone' ? { phone: phone.trim(), code } : { email: email.trim(), code };
      await telegramAuthService.webLogin({ ...params, code });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInput = () => {
    setStep('input');
    setCode('');
    setError('');
  };

  return (
    <Container>
      <AuthCard>
        <Header>
          <Logo>OS Gift</Logo>
          <Title>Вход / Регистрация</Title>
          <Subtitle>
            {step === 'input'
              ? 'Введите номер телефона или email для получения кода'
              : 'Введите код из SMS или письма'}
          </Subtitle>
        </Header>

        {step === 'input' ? (
          <>
            <Tabs>
              <TabButton $active={tab === 'phone'} onClick={() => { setTab('phone'); setError(''); }}>
                Телефон
              </TabButton>
              <TabButton $active={tab === 'email'} onClick={() => { setTab('email'); setError(''); }}>
                Email
              </TabButton>
            </Tabs>

            <Form onSubmit={handleSendCode}>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {tab === 'phone' ? (
                <FormGroup>
                  <Label>Номер телефона</Label>
                  <Input
                    type="tel"
                    placeholder="+7 999 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    disabled={loading}
                  />
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="example@mail.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </FormGroup>
              )}
              <SubmitButton type="submit" disabled={loading}>
                {loading ? <Spinner /> : 'Получить код'}
              </SubmitButton>
            </Form>
          </>
        ) : (
          <Form onSubmit={handleVerifyCode}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <FormGroup>
              <Label>Код подтверждения</Label>
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                maxLength={6}
              />
              <Hint>
                Код отправлен на {tab === 'phone' ? (phone.startsWith('7') ? `+${phone}` : `+7${phone}`) : email}
              </Hint>
            </FormGroup>
            <SubmitButton type="submit" disabled={loading || code.length !== 6}>
              {loading ? <Spinner /> : 'Войти'}
            </SubmitButton>
            <BackButton type="button" onClick={handleBackToInput}>
              ← Изменить номер
            </BackButton>
          </Form>
        )}

        <Footer>
          <Link href="https://os-gift.store">os-gift.store</Link>
        </Footer>
      </AuthCard>
    </Container>
  );
};

export default AuthPage;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 20px;
  background: transparent;
`;

const AuthCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.5s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const Logo = styled.div`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: "ChakraPetch-Regular";
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 18px;
  margin: 0 0 6px 0;
`;

const Subtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  margin: 0;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  border: 1px solid ${(p) => (p.$active ? '#88FB47' : 'rgba(255,255,255,0.2)')};
  border-radius: 10px;
  background: ${(p) => (p.$active ? 'rgba(136, 251, 71, 0.15)' : 'transparent')};
  color: ${(p) => (p.$active ? '#88FB47' : '#737591')};
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #88FB47;
    color: #88FB47;
  }
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
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 14px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  letter-spacing: 2px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    box-shadow: 0 0 0 2px rgba(136, 251, 71, 0.2);
  }

  &::placeholder {
    color: #737591;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Hint = styled.span`
  color: #737591;
  font-size: 12px;
  margin-top: 4px;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 14px;
  color: #1a1a2e;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
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
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid #1a1a2e;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 10px;
  padding: 12px;
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  margin-top: 4px;
  transition: color 0.3s ease;

  &:hover {
    color: #88FB47;
  }
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
`;

const Link = styled.a`
  color: #737591;
  font-size: 12px;
  text-decoration: none;

  &:hover {
    color: #88FB47;
  }
`;
