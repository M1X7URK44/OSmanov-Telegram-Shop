import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

interface User {
  id: number;
  telegram_id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  balance: number | string;
  total_spent: number | string;
  join_date: string;
  created_at: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  totalPages: number;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [balanceValue, setBalanceValue] = useState('');
  const [saving, setSaving] = useState(false);

  const limit = 10;

  // Debounce для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500); // Задержка 500мс

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const search = searchQuery.trim() || undefined;
      const data: UsersResponse = await adminService.getUsers(currentPage, limit, search);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleEditBalance = (user: User) => {
    setEditingUser(user);
    setBalanceValue(Number(user.balance || 0).toString());
  };

  const handleSaveBalance = async () => {
    if (!editingUser) return;

    const newBalance = parseFloat(balanceValue);
    if (isNaN(newBalance) || newBalance < 0) {
      alert('Введите корректное значение баланса');
      return;
    }

    try {
      setSaving(true);
      await adminService.updateUserBalance(editingUser.id, newBalance);
      setEditingUser(null);
      setBalanceValue('');
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Не удалось обновить баланс');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && users.length === 0) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Загрузка пользователей...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Пользователи</Title>
        <StatsInfo>
          Всего пользователей: <strong>{total}</strong>
        </StatsInfo>
      </Header>

      <SearchSection>
        <SearchForm onSubmit={(e) => e.preventDefault()}>
          <SearchInput
            type="text"
            placeholder="Поиск по ID, @username или Telegram ID..."
            value={searchInput}
            onChange={handleSearchInputChange}
          />
          {searchInput && (
            <ClearButton type="button" onClick={handleClearSearch}>
              Очистить
            </ClearButton>
          )}
        </SearchForm>
      </SearchSection>

      {error && (
        <ErrorMessage>
          <ErrorIcon>⚠️</ErrorIcon>
          {error}
        </ErrorMessage>
      )}

      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Telegram ID</TableHeaderCell>
              <TableHeaderCell>@username</TableHeaderCell>
              <TableHeaderCell>Имя</TableHeaderCell>
              <TableHeaderCell>Баланс</TableHeaderCell>
              <TableHeaderCell>Потрачено</TableHeaderCell>
              <TableHeaderCell>Дата регистрации</TableHeaderCell>
              <TableHeaderCell>Действия</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <EmptyRow>
                <EmptyCell colSpan={8}>
                  {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
                </EmptyCell>
              </EmptyRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <IdCell>{user.id}</IdCell>
                  </TableCell>
                  <TableCell>
                    {user.telegram_id ? (
                      <TelegramIdCell>{user.telegram_id}</TelegramIdCell>
                    ) : (
                      <NoData>—</NoData>
                    )}
                  </TableCell>
                  <TableCell>
                    <UsernameCell>@{user.username}</UsernameCell>
                  </TableCell>
                  <TableCell>
                    {user.first_name || user.last_name ? (
                      <NameCell>
                        {user.first_name} {user.last_name}
                      </NameCell>
                    ) : (
                      <NoData>—</NoData>
                    )}
                  </TableCell>
                  <TableCell>
                    <BalanceCell>${Number(user.balance || 0).toFixed(2)}</BalanceCell>
                  </TableCell>
                  <TableCell>
                    <SpentCell>${Number(user.total_spent || 0).toFixed(2)}</SpentCell>
                  </TableCell>
                  <TableCell>
                    <DateCell>{formatDate(user.join_date || user.created_at)}</DateCell>
                  </TableCell>
                  <TableCell>
                    <ActionButton onClick={() => handleEditBalance(user)}>
                      Изменить баланс
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      {totalPages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Назад
          </PaginationButton>
          <PageInfo>
            Страница {currentPage} из {totalPages}
          </PageInfo>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Вперед →
          </PaginationButton>
        </Pagination>
      )}

      {editingUser && (
        <ModalOverlay onClick={() => setEditingUser(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Изменение баланса пользователя</ModalTitle>
              <CloseButton onClick={() => setEditingUser(null)}>×</CloseButton>
            </ModalHeader>
            <ModalBody>
              <UserInfo>
                <UserInfoRow>
                  <UserInfoLabel>ID:</UserInfoLabel>
                  <UserInfoValue>{editingUser.id}</UserInfoValue>
                </UserInfoRow>
                <UserInfoRow>
                  <UserInfoLabel>Username:</UserInfoLabel>
                  <UserInfoValue>@{editingUser.username}</UserInfoValue>
                </UserInfoRow>
                <UserInfoRow>
                  <UserInfoLabel>Текущий баланс:</UserInfoLabel>
                  <UserInfoValue>${Number(editingUser.balance || 0).toFixed(2)}</UserInfoValue>
                </UserInfoRow>
              </UserInfo>
              <FormGroup>
                <Label htmlFor="balance">Новый баланс (USD)</Label>
                <Input
                  type="number"
                  id="balance"
                  value={balanceValue}
                  onChange={(e) => setBalanceValue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </FormGroup>
            </ModalBody>
            <ModalActions>
              <CancelButton type="button" onClick={() => setEditingUser(null)}>
                Отмена
              </CancelButton>
              <SaveButton type="button" onClick={handleSaveBalance} disabled={saving}>
                {saving ? (
                  <>
                    <ButtonSpinner />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </SaveButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AdminUsersPage;

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
const Container = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 28px;
  margin: 0;
`;

const StatsInfo = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;

  strong {
    color: #88FB47;
  }
`;

const SearchSection = styled.div`
  margin-bottom: 24px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 250px;
  background: rgba(255, 255, 255, 0.05);
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
`;

const ClearButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 24px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
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
  margin-bottom: 24px;
`;

const ErrorIcon = styled.span`
  font-size: 16px;
`;

const TableCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  overflow-x: auto;
  max-width: 100%;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(136, 251, 71, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(136, 251, 71, 0.5);
    }
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: rgba(136, 251, 71, 0.1);
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 8px;
  text-align: left;
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  
  &:first-child {
    padding-left: 12px;
  }
  
  &:last-child {
    padding-right: 12px;
  }
`;

const TableCell = styled.td`
  padding: 12px 8px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  white-space: nowrap;
  
  &:first-child {
    padding-left: 12px;
  }
  
  &:last-child {
    padding-right: 12px;
  }
`;

const IdCell = styled.span`
  font-weight: 600;
  color: #88FB47;
  font-family: 'Courier New', monospace;
`;

const TelegramIdCell = styled.span`
  color: #737591;
  font-family: 'Courier New', monospace;
`;

const UsernameCell = styled.span`
  color: #fff;
  font-weight: 500;
`;

const NameCell = styled.span`
  color: #fff;
`;

const BalanceCell = styled.span`
  color: #88FB47;
  font-weight: 600;
`;

const SpentCell = styled.span`
  color: #737591;
`;

const DateCell = styled.span`
  color: #737591;
  font-size: 12px;
`;

const NoData = styled.span`
  color: #737591;
  font-style: italic;
`;

const ActionButton = styled.button`
  background: rgba(136, 251, 71, 0.2);
  border: 1px solid rgba(136, 251, 71, 0.5);
  border-radius: 6px;
  padding: 6px 12px;
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(136, 251, 71, 0.3);
  }
`;

const EmptyRow = styled(TableRow)``;

const EmptyCell = styled.td`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 20px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(136, 251, 71, 0.1);
    border-color: #88FB47;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #1a1a2e;
  border: 1px solid #88FB47;
  border-radius: 20px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #88FB47;
  }
`;

const ModalBody = styled.div`
  margin-bottom: 24px;
`;

const UserInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
`;

const UserInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const UserInfoLabel = styled.span`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const UserInfoValue = styled.span`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(136, 251, 71, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    background: rgba(255, 255, 255, 0.08);
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

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

const CancelButton = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 24px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SaveButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  color: #1a1a2e;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
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
  border-top: 2px solid #1a1a2e;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
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
