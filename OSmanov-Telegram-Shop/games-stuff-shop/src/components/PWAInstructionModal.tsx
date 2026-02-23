import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PWAInstructionAppImage from "../assets/images/pwa-app-instruction.png"
import { useTelegram } from '../context/TelegramContext';
import { useUser } from '../context/UserContext';
import { userApi } from '../api/user.api';

const PWAInstructionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { openLink } = useTelegram();
  const { currentUserId } = useUser();

  useEffect(() => {
    const checkPWAInstructionStatus = async () => {
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        // Проверяем, показывали ли уже пользователю это модальное окно
        const isShown = await userApi.getPWAInstructionStatus(currentUserId);
        
        // Показываем модальное окно только если пользователь еще не нажимал "Добавить"
        if (!isShown) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error checking PWA instruction status:', error);
        // В случае ошибки показываем модальное окно (на случай проблем с API)
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkPWAInstructionStatus();
  }, [currentUserId]);

  const handleAdd = async () => {
    // Открываем ссылку через Telegram WebApp API для добавления на главный экран
    openLink('https://t.me/osGIFT_bot/?startapp&addToHomeScreen');
    
    // Сохраняем статус, что пользователь нажал "Добавить"
    if (currentUserId) {
      try {
        await userApi.setPWAInstructionShown(currentUserId);
        setIsOpen(false);
      } catch (error) {
        console.error('Error saving PWA instruction status:', error);
        // Закрываем модальное окно даже если сохранение не удалось
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleLater = () => {
    setIsOpen(false);
  };

  // Не показываем ничего пока загружается статус
  if (isLoading || !isOpen) return null;

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleLater}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Добавьте бота на главный экран</ModalTitle>
        
        <ImageContainer>
          <InstructionImage 
            src={PWAInstructionAppImage}
            alt="Инструкция по добавлению на главный экран"
            onError={(e) => {
              // Fallback если изображение не найдено
              console.warn(`PWA instruction image not found ${e}`);
            }}
          />
        </ImageContainer>

        <ButtonsContainer>
          <AddButton onClick={handleAdd}>
            Добавить
          </AddButton>
          <LaterButton onClick={handleLater}>
            Позже
          </LaterButton>
        </ButtonsContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PWAInstructionModal;

// Styles
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
  z-index: 1002;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ModalTitle = styled.h2`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  font-family: "ChakraPetch-Regular";
  margin: 0;
  text-align: center;
`;

const ImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InstructionImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const AddButton = styled.button`
  flex: 1;
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

  &:hover {
    background: #7ae03d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(136, 251, 71, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LaterButton = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 14px 24px;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;
