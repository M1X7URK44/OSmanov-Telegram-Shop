import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { promocodeService, type PromocodeWithUsage } from '../services/promocode.service';

const AdminPromocodesPage: React.FC = () => {
  const [promocodes, setPromocodes] = useState<PromocodeWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromocode, setEditingPromocode] = useState<PromocodeWithUsage | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'balance' as 'balance' | 'discount',
    value: '',
    is_active: true,
  });

  useEffect(() => {
    loadPromocodes();
  }, []);

  const loadPromocodes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await promocodeService.getAllPromocodes();
      setPromocodes(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить промокоды');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      type: 'balance',
      value: '',
      is_active: true,
    });
    setEditingPromocode(null);
    setShowCreateModal(true);
  };

  const handleEdit = (promocode: PromocodeWithUsage) => {
    setFormData({
      code: promocode.code,
      type: promocode.type,
      value: promocode.value.toString(),
      is_active: promocode.is_active,
    });
    setEditingPromocode(promocode);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот промокод?')) {
      return;
    }

    try {
      await promocodeService.deletePromocode(id);
      await loadPromocodes();
    } catch (err: any) {
      alert(err.message || 'Не удалось удалить промокод');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(formData.value);
    if (!formData.code.trim()) {
      alert('Введите код промокода');
      return;
    }

    if (isNaN(value) || value <= 0) {
      alert('Введите корректное значение');
      return;
    }

    if (formData.type === 'discount' && (value < 0 || value > 100)) {
      alert('Скидка должна быть от 0 до 100 процентов');
      return;
    }

    try {
      if (editingPromocode) {
        await promocodeService.updatePromocode(editingPromocode.id, {
          code: formData.code,
          type: formData.type,
          value: value,
          is_active: formData.is_active,
        });
      } else {
        await promocodeService.createPromocode({
          code: formData.code,
          type: formData.type,
          value: value,
          is_active: formData.is_active,
        });
      }

      setShowCreateModal(false);
      await loadPromocodes();
    } catch (err: any) {
      alert(err.message || 'Не удалось сохранить промокод');
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Загрузка промокодов...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Управление промокодами</Title>
        <CreateButton onClick={handleCreate}>+ Создать промокод</CreateButton>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TableCard>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Код</TableHeaderCell>
            <TableHeaderCell>Тип</TableHeaderCell>
            <TableHeaderCell>Значение</TableHeaderCell>
            <TableHeaderCell>Статус</TableHeaderCell>
            <TableHeaderCell>Использований</TableHeaderCell>
            <TableHeaderCell>Дата создания</TableHeaderCell>
            <TableHeaderCell>Действия</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promocodes.length === 0 ? (
            <EmptyRow>
              <EmptyCell colSpan={7}>Нет промокодов</EmptyCell>
            </EmptyRow>
          ) : (
            promocodes.map((promocode) => (
              <TableRow key={promocode.id}>
                <TableCell>
                  <CodeCell>{promocode.code}</CodeCell>
                </TableCell>
                <TableCell>
                  <TypeBadge $type={promocode.type}>
                    {promocode.type === 'balance' ? 'Пополнение' : 'Скидка'}
                  </TypeBadge>
                </TableCell>
                <TableCell>
                  {promocode.type === 'balance'
                    ? `${promocode.value} USD`
                    : `${promocode.value}%`}
                </TableCell>
                <TableCell>
                  <StatusBadge $active={promocode.is_active}>
                    {promocode.is_active ? 'Активен' : 'Неактивен'}
                  </StatusBadge>
                </TableCell>
                <TableCell>{promocode.usage_count}</TableCell>
                <TableCell>
                  {new Date(promocode.created_at).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <EditButton onClick={() => handleEdit(promocode)}>
                      Редактировать
                    </EditButton>
                    <DeleteButton onClick={() => handleDelete(promocode.id)}>
                      Удалить
                    </DeleteButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </TableCard>

      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingPromocode ? 'Редактировать промокод' : 'Создать промокод'}
              </ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Код промокода</Label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="PROMO2024"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Тип промокода</Label>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'balance' | 'discount',
                    })
                  }
                >
                  <option value="balance">Пополнение баланса</option>
                  <option value="discount">Скидка на товары</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>
                  {formData.type === 'balance'
                    ? 'Сумма пополнения (USD)'
                    : 'Процент скидки (0-100)'}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'balance' ? '10' : '15'}
                  min={formData.type === 'discount' ? '0' : '0.01'}
                  max={formData.type === 'discount' ? '100' : undefined}
                  step={formData.type === 'discount' ? '1' : '0.01'}
                  required
                />
              </FormGroup>

              <FormGroup>
                <CheckboxContainer>
                  <Checkbox
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  <CheckboxLabel>Активен</CheckboxLabel>
                </CheckboxContainer>
              </FormGroup>

              <FormActions>
                <CancelButton type="button" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </CancelButton>
                <SubmitButton type="submit">
                  {editingPromocode ? 'Сохранить' : 'Создать'}
                </SubmitButton>
              </FormActions>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AdminPromocodesPage;

// Styles
const Container = styled.div`
  padding: 24px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 28px;
  font-weight: 600;
  margin: 0;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  color: #1a1a2e;
  font-family: 'ChakraPetch-Regular';
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.5);
  border-radius: 10px;
  padding: 12px 16px;
  color: #FF4757;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  margin-bottom: 24px;
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
  border-collapse: collapse;
  background: rgba(26, 26, 46, 0.6);
  border-radius: 12px;
  overflow: hidden;
  min-width: 800px;
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
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  color: #88FB47;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  font-weight: 600;
`;

const TableCell = styled.td`
  padding: 16px;
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
`;

const CodeCell = styled.span`
  font-weight: 600;
  color: #88FB47;
  font-family: 'Courier New', monospace;
`;

const TypeBadge = styled.span<{ $type: 'balance' | 'discount' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  background: ${props =>
    props.$type === 'balance'
      ? 'rgba(136, 251, 71, 0.2)'
      : 'rgba(248, 157, 9, 0.2)'};
  color: ${props => (props.$type === 'balance' ? '#88FB47' : '#F89D09')};
  font-size: 12px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  background: ${props =>
    props.$active
      ? 'rgba(39, 193, 81, 0.2)'
      : 'rgba(115, 117, 145, 0.2)'};
  color: ${props => (props.$active ? '#27C151' : '#737591')};
  font-size: 12px;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled.button`
  background: rgba(136, 251, 71, 0.2);
  border: 1px solid rgba(136, 251, 71, 0.5);
  border-radius: 6px;
  padding: 6px 12px;
  color: #88FB47;
  font-family: 'ChakraPetch-Regular';
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(136, 251, 71, 0.3);
  }
`;

const DeleteButton = styled.button`
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.5);
  border-radius: 6px;
  padding: 6px 12px;
  color: #FF4757;
  font-family: 'ChakraPetch-Regular';
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 71, 87, 0.3);
  }
`;

const EmptyRow = styled(TableRow)``;

const EmptyCell = styled.td`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'ChakraPetch-Regular';
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
  font-family: 'ChakraPetch-Regular';
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
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  font-weight: 600;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(136, 251, 71, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(136, 251, 71, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #88FB47;
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: #1a1a2e;
    color: #fff;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  cursor: pointer;
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px 24px;
  color: #fff;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  color: #1a1a2e;
  font-family: 'ChakraPetch-Regular';
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
  }
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
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.span`
  color: #88FB47;
  font-size: 16px;
  font-family: 'ChakraPetch-Regular';
`;
