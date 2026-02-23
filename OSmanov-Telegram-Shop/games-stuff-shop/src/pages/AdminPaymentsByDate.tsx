import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

interface Payment {
  id: number;
  user_id: number;
  username: string;
  telegram_id?: number;
  first_name?: string;
  last_name?: string;
  amount: number | string;
  type: string;
  status: string;
  payment_method?: string;
  payment_date: string;
  service_name?: string;
  service_id?: number;
  quantity?: number;
  custom_id?: string;
  payment_type: 'transaction' | 'purchase';
}

interface PaymentsResponse {
  payments: Payment[];
  total: number;
  totalPages: number;
}

const AdminPaymentsByDatePage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const limit = 50;

  const loadPayments = async (pageToLoad: number = 1) => {
    if (!startDate || !endDate) {
      setError('Укажите период дат');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data: PaymentsResponse = await adminService.getPaymentsByDateRange(
        startDate,
        endDate,
        pageToLoad,
        limit
      );

      setPayments(data.payments);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCurrentPage(pageToLoad);
    } catch (err: any) {
      setPayments([]);
      setTotal(0);
      setTotalPages(1);
      setError(err.message || 'Не удалось загрузить платежи');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPayments(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    loadPayments(nextPage);
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

  const getPaymentTypeLabel = (type: string, paymentType: string): string => {
    if (paymentType === 'purchase') {
      return 'Покупка';
    }
    if (type === 'deposit') {
      return 'Пополнение';
    }
    if (type === 'withdrawal') {
      return 'Вывод';
    }
    return type;
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Успешно';
      case 'pending':
        return 'В ожидании';
      case 'failed':
        return 'Ошибка';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  // Устанавливаем значения по умолчанию (сегодня и месяц назад)
  React.useEffect(() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const formatDateForInput = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (!startDate) {
      setStartDate(formatDateForInput(monthAgo));
    }
    if (!endDate) {
      setEndDate(formatDateForInput(today));
    }
  }, []);

  return (
    <Container>
      <Header>
        <Title>Платежи по датам</Title>
        <Subtitle>Фильтрация всех платежей пользователей (пополнения и покупки) по периоду</Subtitle>
      </Header>

      <SearchCard>
        <SearchForm onSubmit={handleSearchSubmit}>
          <DateRow>
            <DateInputGroup>
              <DateLabel>Дата начала</DateLabel>
              <DateInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </DateInputGroup>
            <DateInputGroup>
              <DateLabel>Дата окончания</DateLabel>
              <DateInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </DateInputGroup>
            <SearchButton type="submit" disabled={loading}>
              {loading ? 'Загрузка...' : 'Найти'}
            </SearchButton>
          </DateRow>
        </SearchForm>
      </SearchCard>

      {error && (
        <ErrorMessage>
          <ErrorIcon>⚠️</ErrorIcon>
          {error}
        </ErrorMessage>
      )}

      {total > 0 && (
        <StatsCard>
          <StatsItem>
            <StatsValue>{total}</StatsValue>
            <StatsLabel>Всего платежей</StatsLabel>
          </StatsItem>
          <StatsItem>
            <StatsValue>
              ${formatMoney(
                payments
                  .filter((p) => p.status === 'completed')
                  .reduce((sum, p) => {
                    const amount = Number(p.amount || 0);
                    return p.type === 'deposit' || p.payment_type === 'purchase'
                      ? sum + Math.abs(amount)
                      : sum;
                  }, 0)
              )}
            </StatsValue>
            <StatsLabel>Общая сумма</StatsLabel>
          </StatsItem>
        </StatsCard>
      )}

      {loading && payments.length === 0 && (
        <LoadingContainer>
          <Spinner />
          <LoadingText>Загрузка данных...</LoadingText>
        </LoadingContainer>
      )}

      {payments.length > 0 && (
        <>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Пользователь</TableHeaderCell>
                  <TableHeaderCell>Тип</TableHeaderCell>
                  <TableHeaderCell>Услуга</TableHeaderCell>
                  <TableHeaderCell>Сумма, USD</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Метод</TableHeaderCell>
                  <TableHeaderCell>Дата</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={`${payment.payment_type}-${payment.id}`}>
                    <TableCell>
                      <IdCell>{payment.id}</IdCell>
                    </TableCell>
                    <TableCell>
                      <UserCell>
                        <UserName>@{payment.username}</UserName>
                        {payment.telegram_id && (
                          <UserIdTag>TG: {payment.telegram_id}</UserIdTag>
                        )}
                      </UserCell>
                    </TableCell>
                    <TableCell>
                      <TypeBadge $type={payment.type} $paymentType={payment.payment_type}>
                        {getPaymentTypeLabel(payment.type, payment.payment_type)}
                      </TypeBadge>
                    </TableCell>
                    <TableCell>
                      {payment.service_name ? (
                        <ServiceName>{payment.service_name}</ServiceName>
                      ) : (
                        <NoData>—</NoData>
                      )}
                    </TableCell>
                    <TableCell>
                      <AmountCell $type={payment.type} $paymentType={payment.payment_type}>
                        {payment.type === 'withdrawal' ? '-' : '+'}
                        ${formatMoney(payment.amount)}
                      </AmountCell>
                    </TableCell>
                    <TableCell>
                      <StatusBadge $status={payment.status}>
                        {getStatusLabel(payment.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <MethodCell>{payment.payment_method || '—'}</MethodCell>
                    </TableCell>
                    <TableCell>
                      <DateCell>{formatDate(payment.payment_date)}</DateCell>
                    </TableCell>
                  </TableRow>
                ))}
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

      {!loading && payments.length === 0 && startDate && endDate && (
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>Платежи за указанный период не найдены</EmptyText>
        </EmptyState>
      )}
    </Container>
  );
};

export default AdminPaymentsByDatePage;

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

const DateRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 150px;
`;

const DateLabel = styled.label`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
`;

const DateInput = styled.input`
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
  height: fit-content;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

const StatsCard = styled.div`
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
`;

const StatsItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatsValue = styled.div`
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 22px;
  font-weight: 600;
`;

const StatsLabel = styled.div`
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

const UserCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const UserName = styled.span`
  color: #fff;
  font-weight: 500;
`;

const UserIdTag = styled.span`
  font-size: 11px;
  color: #737591;
  font-family: 'Courier New', monospace;
`;

const TypeBadge = styled.span<{ $type: string; $paymentType: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-family: "ChakraPetch-Regular";
  font-weight: 600;
  background: ${({ $type, $paymentType }) =>
    $paymentType === 'purchase'
      ? 'rgba(136, 251, 71, 0.15)'
      : $type === 'deposit'
      ? 'rgba(39, 193, 81, 0.15)'
      : 'rgba(255, 71, 87, 0.15)'};
  color: ${({ $type, $paymentType }) =>
    $paymentType === 'purchase'
      ? '#88FB47'
      : $type === 'deposit'
      ? '#27C151'
      : '#FF4757'};
`;

const ServiceName = styled.span`
  color: #fff;
`;

const AmountCell = styled.span<{ $type: string; $paymentType: string }>`
  color: ${({ $type, $paymentType }) =>
    $paymentType === 'purchase' || $type === 'deposit'
      ? '#88FB47'
      : '#FF4757'};
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

const MethodCell = styled.span`
  color: #737591;
  font-size: 12px;
`;

const DateCell = styled.span`
  color: #737591;
  font-size: 12px;
`;

const NoData = styled.span`
  color: #737591;
  font-style: italic;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
`;

const EmptyText = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
`;
