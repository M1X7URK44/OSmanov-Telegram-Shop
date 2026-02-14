import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminService.login(formData);
      navigate('/admin');
    } catch (err) {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <Logo>ADMIN</Logo>
          <LoginTitle>Административная панель</LoginTitle>
          <LoginSubtitle>Введите данные для входа</LoginSubtitle>
        </LoginHeader>

        <LoginForm onSubmit={handleSubmit}>
          {error && (
            <ErrorMessage>
              <ErrorIcon>⚠️</ErrorIcon>
              {error}
            </ErrorMessage>
          )}

          <FormGroup>
            <InputLabel htmlFor="username">Логин</InputLabel>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Введите логин"
              required
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <InputLabel htmlFor="password">Пароль</InputLabel>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Введите пароль"
              required
              disabled={loading}
            />
          </FormGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <ButtonSpinner />
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </LoginButton>

          <BackLink onClick={() => navigate('/')}>
            ← Вернуться на сайт
          </BackLink>
        </LoginForm>
      </LoginCard>
    </LoginContainer>
  );
};

export default AdminLoginPage;

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
const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e17 0%, #1a1a2e 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.6s ease-out;
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Logo = styled.div`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: "ChakraPetch-Regular";
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const LoginTitle = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  margin: 0 0 8px 0;
`;

const LoginSubtitle = styled.p`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin: 0;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
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

const LoginButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 14px;
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

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }

  &:disabled {
    opacity: 0.7;
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

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 10px;
  padding: 12px;
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ErrorIcon = styled.span`
  font-size: 16px;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  margin-top: 10px;
  transition: color 0.3s ease;

  &:hover {
    color: #88FB47;
  }
`;