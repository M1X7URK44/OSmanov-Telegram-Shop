import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

interface AdminUser {
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

interface UserPurchase {
  id: number;
  user_id: number;
  service_id: number | null;
  service_name: string;
  quantity?: number;
  amount: number | string;
  total_price?: number | string;
  currency: string;
  status: string;
  purchase_date: string;
  created_at: string;
  custom_id?: string;
}

interface UserPurchasesResponse {
  user: AdminUser;
  purchases: UserPurchase[];
  total: number;
  totalPages: number;
}

const AdminUserTransactionsPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const limit = 20;

  const loadPurchases = async (pageToLoad: number, query?: string) => {
    try {
      setLoading(true);
      setError('');

      const rawQuery = (query ?? lastQuery ?? '').trim();
      if (!rawQuery) {
        setError('Укажите ID пользователя или @username');
        return;
      }

      const isNumeric = /^\d+$/.test(rawQuery);

      const options: { userId?: number; username?: string; page?: number; limit?: number } = {
        page: pageToLoad,
        limit,
      };

      if (isNumeric) {
        const id = parseInt(rawQuery, 10);
        options.userId = id;
      } else {
        const username = rawQuery.replace(/^@/, '').trim();
        if (!username) {
          setError('Введите @username или ID пользователя');
          return;
        }
        options.username = username;
      }

      const data: UserPurchasesResponse = await adminService.getUserPurchases(options);

      setCurrentUser(data.user);
      setPurchases(data.purchases);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(pageToLoad);
      setLastQuery(rawQuery);
    } catch (err: any) {
      setPurchases([]);
      setCurrentUser(null);
      setTotal(0);
      setTotalPages(1);
      setError(err.message || 'Не удалось загрузить транзакции пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = searchInput.trim();
    if (!trimmed) {
      setError('Введите значение для поиска');
      return;
    }

    setLastQuery(trimmed);
    loadPurchases(1, trimmed);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || !lastQuery) return;
    loadPurchases(nextPage);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (value: number | string): string => {
    const num = Number(value || 0);
    return num.toFixed(2);
  };

  return (
    <Container>
      <Header>
        <Title>Транзакции пользователя</Title>
        <Subtitle>Поиск всех покупок по ID пользователя или @username</Subtitle>
      </Header>

      <SearchCard>
        <SearchForm onSubmit={handleSearchSubmit}>
          <SearchRow>
            <SearchInput
              type="text"
              placeholder="Введите ID пользователя или @username (например: 1 или @user)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <SearchButton type="submit" disabled={loading}>
              {loading ? 'Поиск...' : 'Найти'}
            </SearchButton>
          </SearchRow>

          {lastQuery && currentUser && (
            <SearchHint>
              Показаны результаты для{' '}
              <strong>
                {/^\d+$/.test(lastQuery)
                  ? `ID ${currentUser.id}`
                  : `@${currentUser.username}`}
              </strong>
            </SearchHint>
          )}
        </SearchForm>
      </SearchCard>

      {error && (
        <ErrorMessage>
          <ErrorIcon>⚠️</ErrorIcon>
          {error}
        </ErrorMessage>
      )}

      {currentUser && (
        <UserInfoCard>
          <UserHeaderRow>
            <UserMainInfo>
              <UserAvatar>
                {currentUser.username?.charAt(0)?.toUpperCase() || currentUser.id}
              </UserAvatar>
              <UserTextBlock>
                <UserNameRow>
                  <UserName>@{currentUser.username}</UserName>
                  <UserIdTag>ID: {currentUser.id}</UserIdTag>
                  {currentUser.telegram_id && (
                    <UserIdTag>TG: {currentUser.telegram_id}</UserIdTag>
                  )}
                </UserNameRow>
                <UserMetaRow>
                  {currentUser.first_name || currentUser.last_name ? (
                    <UserMetaItem>
                      {currentUser.first_name} {currentUser.last_name}
                    </UserMetaItem>
                  ) : null}
                  <UserMetaItem>Баланс: ${formatMoney(currentUser.balance)}</UserMetaItem>
                  <UserMetaItem>Потрачено: ${formatMoney(currentUser.total_spent)}</UserMetaItem>
                </UserMetaRow>
              </UserTextBlock>
            </UserMainInfo>
            <UserStats>
              <UserStatsValue>{total}</UserStatsValue>
              <UserStatsLabel>Всего транзакций</UserStatsLabel>
            </UserStats>
          </UserHeaderRow>
        </UserInfoCard>
      )}

      {loading && !currentUser && (
        <LoadingContainer>
          <Spinner />
          <LoadingText>Загрузка данных...</LoadingText>
        </LoadingContainer>
      )}

      {currentUser && (
        <>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Код заказа</TableHeaderCell>
                  <TableHeaderCell>Что купил</TableHeaderCell>
                  <TableHeaderCell>Кол-во</TableHeaderCell>
                  <TableHeaderCell>Сумма, USD</TableHeaderCell>
                  <TableHeaderCell>Итого, USD</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Дата</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <EmptyRow>
                    <EmptyCell colSpan={8}>У этого пользователя еще нет покупок</EmptyCell>
                  </EmptyRow>
                ) : (
                  purchases.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <IdCell>{item.id}</IdCell>
                      </TableCell>
                      <TableCell>
                        {item.custom_id ? <CodeCell>{item.custom_id}</CodeCell> : <NoData>—</NoData>}
                      </TableCell>
                      <TableCell>
                        <ServiceName>{item.service_name}</ServiceName>
                      </TableCell>
                      <TableCell>
                        <QuantityCell>{item.quantity ?? 1}</QuantityCell>
                      </TableCell>
                      <TableCell>
                        <AmountCell>${formatMoney(item.amount)}</AmountCell>
                      </TableCell>
                      <TableCell>
                        <AmountCell>
                          ${formatMoney(item.total_price ?? item.amount)}
                        </AmountCell>
                      </TableCell>
                      <TableCell>
                        <StatusBadge $status={item.status}>
                          {item.status === 'completed'
                            ? 'Успешно'
                            : item.status === 'pending'
                            ? 'В ожидании'
                            : 'Ошибка'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <DateCell>{formatDate(item.purchase_date || item.created_at)}</DateCell>
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
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Назад
              </PaginationButton>
              <PageInfo>
                Страница {currentPage} из {totalPages}
              </PageInfo>
              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Вперед →
              </PaginationButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

export default AdminUserTransactionsPage;

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
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 26px;
  margin: 0;
`;

const Subtitle = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
`;

const SearchCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 10px;
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

const SearchButton = styled.button`
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
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SearchHint = styled.div`
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  color: #737591;

  strong {
    color: #88FB47;
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
  margin-bottom: 20px;
`;

const ErrorIcon = styled.span`
  font-size: 16px;
`;

const UserInfoCard = styled.div`
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 20px;
`;

const UserHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const UserMainInfo = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
`;

const UserAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a2e;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
`;

const UserTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const UserNameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const UserName = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
  font-weight: 600;
`;

const UserIdTag = styled.div`
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 11px;
`;

const UserMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

const UserMetaItem = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const UserStats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const UserStatsValue = styled.div`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 22px;
  font-weight: 600;
`;

const UserStatsLabel = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const TableCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  backdrop-filter: blur(10px);
  overflow-x: auto;
  max-width: 100%;
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
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
`;

const TableCell = styled.td`
  padding: 12px 8px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 13px;
  white-space: nowrap;
`;

const IdCell = styled.span`
  font-weight: 600;
  color: #88FB47;
  font-family: 'Courier New', monospace;
`;

const CodeCell = styled.span`
  font-weight: 500;
  color: #f8f89d;
  font-family: 'Courier New', monospace;
`;

const ServiceName = styled.span`
  color: #fff;
`;

const QuantityCell = styled.span`
  color: #fff;
`;

const AmountCell = styled.span`
  color: #88FB47;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-family: "ChakraPetch-Regular";
  font-weight: 600;
  background: ${({ $status }) =>
    $status === 'completed'
      ? 'rgba(39, 193, 81, 0.15)'
      : $status === 'pending'
      ? 'rgba(248, 157, 9, 0.15)'
      : 'rgba(255, 71, 87, 0.15)'};
  color: ${({ $status }) =>
    $status === 'completed' ? '#27C151' : $status === 'pending' ? '#F89D09' : '#FF4757'};
`;

const DateCell = styled.span`
  color: #737591;
  font-size: 12px;
`;

const NoData = styled.span`
  color: #737591;
  font-style: italic;
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
  margin-top: 24px;
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(136, 251, 71, 0.3);
  border-top: 4px solid #88FB47;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  color: #88FB47;
  font-size: 14px;
  font-family: "ChakraPetch-Regular";
`;

