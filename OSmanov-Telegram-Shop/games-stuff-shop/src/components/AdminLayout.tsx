import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

// Иконки для боковой панели
import Logo from "../assets/icons/Logo.svg";
import SettingsIcon from "../assets/icons/settings-icon.svg";
import LogoutIcon from "../assets/icons/logout-icon.svg";

interface AdminLayoutProps {
  children?: React.ReactNode;
  currentPage?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage = 'dashboard' }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Инициализируем isMobile сразу при монтировании компонента
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  // Инициализируем sidebarCollapsed в зависимости от размера экрана
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await adminService.getProfile();
        setUser(profile);
      } catch (error) {
        console.error('Failed to load user:', error);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  const handleNavigation = (page: string) => {
    navigate(`/admin/${page}`);
    // Закрываем меню на мобильных после перехода
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  // Адаптивность для мобильных устройств
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Загрузка...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <AdminContainer>
      {/* Overlay для мобильных устройств */}
      {!sidebarCollapsed && isMobile && (
        <Overlay onClick={() => setSidebarCollapsed(true)} />
      )}
      
      <Sidebar $collapsed={sidebarCollapsed}>
        <SidebarHeader>
          <LogoContainer>
            <StyledLogo src={Logo} alt="Logo" />
            {!sidebarCollapsed && <LogoText>ADMIN PANEL</LogoText>}
          </LogoContainer>
          <CollapseButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </CollapseButton>
        </SidebarHeader>

        <UserInfo $collapsed={sidebarCollapsed}>
          <UserAvatar>
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </UserAvatar>
          {!sidebarCollapsed && (
            <UserDetails>
              <UserName>{user?.username || 'Admin'}</UserName>
              <UserRole>{user?.role || 'admin'}</UserRole>
            </UserDetails>
          )}
        </UserInfo>

        <NavMenu>
          <NavItem 
            $active={currentPage === 'statistics'} 
            onClick={() => handleNavigation('statistics')}
          >
            <NavIconText>📊</NavIconText>
            {!sidebarCollapsed && <NavLabel>Статистика</NavLabel>}
          </NavItem>
          <NavItem 
            $active={currentPage === 'users'} 
            onClick={() => handleNavigation('users')}
          >
            <NavIconText>👥</NavIconText>
            {!sidebarCollapsed && <NavLabel>Пользователи</NavLabel>}
          </NavItem>
          <NavItem 
            $active={currentPage === 'user-transactions'} 
            onClick={() => handleNavigation('user-transactions')}
          >
            <NavIconText>💳</NavIconText>
            {!sidebarCollapsed && <NavLabel>Транзакции</NavLabel>}
          </NavItem>
          <NavItem 
            $active={currentPage === 'promocodes'} 
            onClick={() => handleNavigation('promocodes')}
          >
            <NavIconText>🎟️</NavIconText>
            {!sidebarCollapsed && <NavLabel>Промокоды</NavLabel>}
          </NavItem>
          <NavItem 
            $active={currentPage === 'settings'} 
            onClick={() => handleNavigation('settings')}
          >
            <NavIcon src={SettingsIcon} alt="Settings" />
            {!sidebarCollapsed && <NavLabel>Настройки</NavLabel>}
          </NavItem>
        </NavMenu>

        <LogoutButton onClick={handleLogout}>
          <LogoutIconImg src={LogoutIcon} alt="Logout" />
          {!sidebarCollapsed && <LogoutText>Выход</LogoutText>}
        </LogoutButton>
      </Sidebar>

      <MainContent $sidebarCollapsed={sidebarCollapsed}>
        <Header>
          <HeaderLeft>
            <MobileMenuButton 
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Открыть меню"
            >
              ☰
            </MobileMenuButton>
            <PageTitle>
              {currentPage === 'statistics' && 'Статистика'}
              {currentPage === 'users' && 'Пользователи'}
              {currentPage === 'user-transactions' && 'Транзакции пользователя'}
              {currentPage === 'promocodes' && 'Промокоды'}
              {currentPage === 'settings' && 'Настройки'}
            </PageTitle>
          </HeaderLeft>
        </Header>
        <Content>
          {/* Используем Outlet для вложенных роутов */}
          {children}
        </Content>
      </MainContent>
    </AdminContainer>
  );
};

export default AdminLayout;

// Animations
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styles
const AdminContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0a0e17;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Sidebar = styled.div<{ $collapsed: boolean }>`
  width: ${props => props.$collapsed ? '80px' : '250px'};
  background: rgba(21, 25, 50, 0.9);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, transform 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 1001;

  @media (max-width: 768px) {
    width: 250px;
    transform: ${props => props.$collapsed ? 'translateX(-100%)' : 'translateX(0)'};
    box-shadow: ${props => props.$collapsed ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.3)'};
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledLogo = styled.img`
  width: 32px;
  height: 32px;
`;

const LogoText = styled.div`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
`;

const CollapseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: #fff;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserInfo = styled.div<{ $collapsed: boolean }>`
  padding: 20px;
  display: flex;
  align-items: center;
  gap: ${props => props.$collapsed ? '0' : '12px'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
`;

const UserName = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  text-transform: capitalize;
`;

const NavMenu = styled.div`
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavItem = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$active ? 'rgba(136, 251, 71, 0.1)' : 'transparent'};
  border-right: 3px solid ${props => props.$active ? '#88FB47' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const NavIcon = styled.img`
  width: 20px;
  height: 20px;
  filter: invert(68%) sepia(90%) saturate(500%) hue-rotate(360deg) brightness(100%) contrast(105%);
  flex-shrink: 0;
`;

const NavIconText = styled.div`
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NavLabel = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  white-space: nowrap;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  background: rgba(255, 71, 87, 0.1);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 71, 87, 0.2);
  }
`;

const LogoutIconImg = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const LogoutText = styled.div`
  white-space: nowrap;
`;

const MainContent = styled.div<{ $sidebarCollapsed: boolean }>`
  flex: 1;
  margin-left: ${props => props.$sidebarCollapsed ? '80px' : '250px'};
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: ${props => props.$sidebarCollapsed ? '0' : '250px'};
  }
`;

const Header = styled.header`
  background: rgba(21, 25, 50, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 999;

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s ease;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1002;
  padding: 0;
  margin: 0;

  @media (max-width: 768px) {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PageTitle = styled.h1`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 24px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Content = styled.div`
  padding: 30px;
  min-height: calc(100vh - 80px);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0e17;
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
  margin-top: 20px;
`;
