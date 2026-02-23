import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminService } from '../services/admin.service';

interface StatisticsData {
  totalUsers: number;
  newUsersDay: number;
  newUsersWeek: number;
  newUsersMonth: number;
  dailyStats: Array<{ date: string; count: number }>;
  weeklyStats: Array<{ week: string; count: number }>;
  monthlyStats: Array<{ month: string; count: number }>;
}

const AdminStatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getStatistics();
      setStatistics(data);
    } catch (err) {
      setError('Не удалось загрузить статистику');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const formatWeek = (weekString: string): string => {
    const date = new Date(weekString);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return `Неделя ${formatDate(weekStart.toISOString())}`;
  };

  const formatMonth = (monthString: string): string => {
    const date = new Date(monthString);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const getChartData = () => {
    if (!statistics) return [];

    switch (period) {
      case 'day':
        return statistics.dailyStats.map(item => ({
          label: formatDate(item.date),
          value: item.count
        }));
      case 'week':
        return statistics.weeklyStats.map(item => ({
          label: formatWeek(item.week),
          value: item.count
        }));
      case 'month':
        return statistics.monthlyStats.map(item => ({
          label: formatMonth(item.month),
          value: item.count
        }));
      default:
        return [];
    }
  };

  const getMaxValue = () => {
    const data = getChartData();
    if (data.length === 0) return 10;
    const max = Math.max(...data.map(d => d.value));
    return max === 0 ? 10 : Math.ceil(max * 1.2);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Загрузка статистики...</LoadingText>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={loadStatistics}>Повторить</RetryButton>
      </ErrorContainer>
    );
  }

  if (!statistics) {
    return null;
  }

  const chartData = getChartData();
  const maxValue = getMaxValue();

  return (
    <StatisticsContainer>
      <StatisticsHeader>
        <HeaderTitle>Статистика пользователей</HeaderTitle>
        <RefreshButton onClick={loadStatistics}>Обновить</RefreshButton>
      </StatisticsHeader>

      <StatsCards>
        <StatCard>
          <StatIcon>👥</StatIcon>
          <StatContent>
            <StatLabel>Всего пользователей</StatLabel>
            <StatValue>{statistics.totalUsers}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>📅</StatIcon>
          <StatContent>
            <StatLabel>Новых за день</StatLabel>
            <StatValue>{statistics.newUsersDay}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>📆</StatIcon>
          <StatContent>
            <StatLabel>Новых за неделю</StatLabel>
            <StatValue>{statistics.newUsersWeek}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon>📊</StatIcon>
          <StatContent>
            <StatLabel>Новых за месяц</StatLabel>
            <StatValue>{statistics.newUsersMonth}</StatValue>
          </StatContent>
        </StatCard>
      </StatsCards>

      <ChartSection>
        <ChartHeader>
          <ChartTitle>График новых пользователей</ChartTitle>
          <PeriodSelector>
            <PeriodButton 
              $active={period === 'day'} 
              onClick={() => setPeriod('day')}
            >
              День
            </PeriodButton>
            <PeriodButton 
              $active={period === 'week'} 
              onClick={() => setPeriod('week')}
            >
              Неделя
            </PeriodButton>
            <PeriodButton 
              $active={period === 'month'} 
              onClick={() => setPeriod('month')}
            >
              Месяц
            </PeriodButton>
          </PeriodSelector>
        </ChartHeader>

        <ChartCard>
          <ChartContainer>
            {chartData.length > 0 ? (
              <BarChart>
                {chartData.map((item, index) => {
                  const height = (item.value / maxValue) * 100;
                  return (
                    <BarGroup key={index}>
                      <BarWrapper>
                        <Bar $height={height}>
                          <BarValue>{item.value}</BarValue>
                        </Bar>
                      </BarWrapper>
                      <BarLabel>{item.label}</BarLabel>
                    </BarGroup>
                  );
                })}
              </BarChart>
            ) : (
              <EmptyChart>Нет данных для отображения</EmptyChart>
            )}
          </ChartContainer>
        </ChartCard>
      </ChartSection>
    </StatisticsContainer>
  );
};

export default AdminStatisticsPage;

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
const StatisticsContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
`;

const StatisticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const HeaderTitle = styled.h2`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 28px;
  margin: 0;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 20px;
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(136, 251, 71, 0.1);
  border-radius: 12px;
  flex-shrink: 0;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 32px;
  font-weight: 600;
`;

const ChartSection = styled.div`
  margin-top: 30px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const ChartTitle = styled.h3`
  color: #fff;
  font-family: "ChakraPetch-Regular";
  font-size: 20px;
  margin: 0;
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 8px;
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(136, 251, 71, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.$active ? '#88FB47' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  padding: 8px 16px;
  color: ${props => props.$active ? '#88FB47' : '#fff'};
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(136, 251, 71, 0.15);
    border-color: #88FB47;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
`;

const ChartContainer = styled.div`
  width: 100%;
  min-height: 300px;
`;

const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 10px;
  height: 300px;
  padding: 20px 0;
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
`;

const BarWrapper = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
`;

const Bar = styled.div<{ $height: number }>`
  width: 100%;
  max-width: 60px;
  height: ${props => props.$height}%;
  min-height: ${props => props.$height > 0 ? '20px' : '0'};
  background: linear-gradient(180deg, #88FB47 0%, #27C151 100%);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
    transform: scaleY(1.05);
  }
`;

const BarValue = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  color: #88FB47;
  font-family: "ChakraPetch-Regular";
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;

const BarLabel = styled.div`
  margin-top: 10px;
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 11px;
  text-align: center;
  writing-mode: horizontal-tb;
  transform: rotate(0deg);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #737591;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 20px;
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  font-family: "ChakraPetch-Regular";
  font-size: 16px;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  color: white;
  font-family: "ChakraPetch-Regular";
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }
`;
