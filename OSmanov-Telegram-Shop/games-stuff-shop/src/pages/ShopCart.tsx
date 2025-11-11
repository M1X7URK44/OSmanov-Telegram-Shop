import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCart } from '../context/CartContext';
import { useOrders } from '../hooks/useOrders';
import { useCurrency } from '../hooks/useCurrency';
import { type CheckoutItemResult } from '../services/orderService';

const ShopCartPage: React.FC = () => {
    const { state, updateQuantity, removeItem, clearCart, updateUserData, requiresUserData } = useCart();
    const { items, total } = state;
    const { checkout, loading, error, result, validateCheckout, getStatusColor } = useOrders();
    const { convertToRub, formatRubles, usdToRubRate, loading: ratesLoading } = useCurrency();

    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [convertedPrices, setConvertedPrices] = useState<{ [key: number]: number }>({});
    const [convertedTotal, setConvertedTotal] = useState<number>(0);
    const [convertedResultTotal, setConvertedResultTotal] = useState<number | null>(null);

    // Конвертация цен товаров в рубли
    useEffect(() => {
        const convertPrices = async () => {
            const prices: { [key: number]: number } = {};
            let totalRub = 0;

            for (const item of items) {
                try {
                    // Конвертируем цену за единицу товара
                    const rubPrice = await convertToRub(item.price || 0, item.currency || 'USD');
                    prices[item.service_id] = rubPrice;
                    
                    // Добавляем к общей сумме (цена × количество)
                    totalRub += rubPrice * item.quantity;
                } catch (err) {
                    console.error(`Error converting price for item ${item.service_id}:`, err);
                    // Fallback на примерный курс
                    const fallbackPrice = (item.price || 0) * (usdToRubRate || 90);
                    prices[item.service_id] = fallbackPrice;
                    totalRub += fallbackPrice * item.quantity;
                }
            }

            setConvertedPrices(prices);
            setConvertedTotal(totalRub);
        };

        if (items.length > 0 && !ratesLoading) {
            convertPrices();
        } else {
            setConvertedPrices({});
            setConvertedTotal(0);
        }
    }, [items, convertToRub, ratesLoading, usdToRubRate]);

    // Конвертация общей суммы результата заказа
    useEffect(() => {
        const convertResultTotal = async () => {
            if (result?.data.total_amount) {
                try {
                    const rubAmount = await convertToRub(result.data.total_amount, 'USD');
                    setConvertedResultTotal(rubAmount);
                } catch (err) {
                    console.error('Error converting result total:', err);
                    setConvertedResultTotal(result.data.total_amount * (usdToRubRate || 90));
                }
            }
        };

        if (result) {
            convertResultTotal();
        }
    }, [result, convertToRub, usdToRubRate]);

    const handleQuantityChange = (serviceId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(serviceId);
        } else {
            updateQuantity(serviceId, newQuantity);
        }
    };

    const handleRemoveItem = (serviceId: number) => {
        removeItem(serviceId);
    };

    const handleUserDataChange = (serviceId: number, value: string) => {
        updateUserData(serviceId, value);
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        
        // Проверяем валидацию перед отправкой
        const validationError = validateCheckout(items);
        if (validationError) {
            alert(validationError);
            return;
        }

        setShowCheckoutModal(true);
        
        try {
            // В реальном приложении здесь будет ID текущего пользователя из контекста/авторизации
            const userId = 1; // Временно используем ID 1 для теста
            
            await checkout(userId, items);
            
        } catch (err) {
            console.error('Checkout error:', err);
            // Ошибка уже обработана в хуке useOrders
        }

        window.location.replace('/');
    };

    const handleCloseModal = () => {
        setShowCheckoutModal(false);
        // Очищаем корзину только если все заказы успешны
        if (result && result.data.total_failed === 0) {
            clearCart();
        }
    };

    const handleRetryCheckout = () => {
        setShowCheckoutModal(false);
        // Даем пользователю возможность исправить ошибки и попробовать снова
    };

    const getStatusMessage = (status: number): string => {
        switch (status) {
            case 2: return '✅ Успешно завершено';
            case 3: return '❌ Ошибка';
            default: return '⏳ В обработке';
        }
    };

    // Функция для форматирования цены с отображением оригинальной валюты
    const formatPriceWithOriginal = (price: number, currency: string, serviceId: number) => {
        const rubPrice = convertedPrices[serviceId];
        const totalRub = rubPrice ? rubPrice * (items.find(item => item.service_id === serviceId)?.quantity || 1) : 0;
        
        return (
            <PriceContainer>
                <RubPrice>
                    {rubPrice ? formatRubles(totalRub) : 'Загрузка...'}
                </RubPrice>
                <OriginalPrice>
                    {price} {currency} × {items.find(item => item.service_id === serviceId)?.quantity || 1} = {(price * (items.find(item => item.service_id === serviceId)?.quantity || 1)).toFixed(2)} {currency}
                </OriginalPrice>
            </PriceContainer>
        );
    };

    if (items.length === 0 && !showCheckoutModal) {
        return (
            <CartContainer>
                <CartHeader>
                    <CartTitle>Корзина покупок</CartTitle>
                </CartHeader>
                <EmptyCart>
                    <EmptyCartIcon>🛒</EmptyCartIcon>
                    <EmptyCartText>Ваша корзина пуста</EmptyCartText>
                    <EmptyCartSubtext>Добавьте товары из каталога</EmptyCartSubtext>
                </EmptyCart>
            </CartContainer>
        );
    }

    return (
        <>
            <CartContainer>
                <CartHeader>
                    <CartTitle>Корзина покупок</CartTitle>
                    <ClearCartButton onClick={clearCart}>
                        Очистить корзину
                    </ClearCartButton>
                </CartHeader>

                <CartItems>
                    {items.map((item) => (
                        <CartItem key={item.service_id}>
                            <ItemInfo>
                                <ItemName>{item.service_name}</ItemName>
                                {item.service_description && (
                                    <ItemDescription>{item.service_description}</ItemDescription>
                                )}
                                <ItemPrice>
                                    {formatPriceWithOriginal(item.price || 0, item.currency || 'USD', item.service_id)}
                                </ItemPrice>
                                
                                {/* Поле для ввода данных, если требуется */}
                                {requiresUserData(item.service_name) && (
                                    <DataInputContainer>
                                        <DataInputLabel>
                                            {item.service_name.includes('Steam') ? 'Steam логин' : 'Дополнительные данные'} *
                                        </DataInputLabel>
                                        <DataInput
                                            type="text"
                                            placeholder={item.service_name.includes('Steam') ? 'Введите ваш Steam логин' : 'Введите необходимые данные'}
                                            value={item.userData || ''}
                                            onChange={(e) => handleUserDataChange(item.service_id, e.target.value)}
                                        />
                                        <DataInputHint>
                                            * Обязательное поле для этого товара
                                        </DataInputHint>
                                    </DataInputContainer>
                                )}
                            </ItemInfo>
                            
                            <ItemControls>
                                <QuantityControl>
                                    <QuantityButton 
                                        onClick={() => handleQuantityChange(item.service_id, item.quantity - 1)}
                                        disabled={loading}
                                    >
                                        -
                                    </QuantityButton>
                                    <QuantityDisplay>{item.quantity}</QuantityDisplay>
                                    <QuantityButton 
                                        onClick={() => handleQuantityChange(item.service_id, item.quantity + 1)}
                                        disabled={loading}
                                    >
                                        +
                                    </QuantityButton>
                                </QuantityControl>
                                <RemoveButton 
                                    onClick={() => handleRemoveItem(item.service_id)}
                                    disabled={loading}
                                >
                                    Удалить
                                </RemoveButton>
                            </ItemControls>
                        </CartItem>
                    ))}
                </CartItems>

                <CartSummary>
                    <TotalSummary>
                        <SummaryRow>
                            <SummaryLabel>Количество товаров:</SummaryLabel>
                            <SummaryValue>
                                {items.reduce((total, item) => total + item.quantity, 0)}
                            </SummaryValue>
                        </SummaryRow>
                        <SummaryRow>
                            <SummaryLabel>Общая сумма:</SummaryLabel>
                            <SummaryValue>
                                {convertedTotal > 0 ? formatRubles(convertedTotal) : 'Загрузка...'}
                                <OriginalTotal>
                                    {total.toFixed(2)} USD
                                </OriginalTotal>
                            </SummaryValue>
                        </SummaryRow>
                    </TotalSummary>
                    
                    <CheckoutButton 
                        onClick={handleCheckout}
                        disabled={loading || items.length === 0 || ratesLoading}
                    >
                        {loading ? 'Обработка...' : 
                         ratesLoading ? 'Загрузка курса...' : 
                         `Купить за ${formatRubles(convertedTotal)}`}
                    </CheckoutButton>
                </CartSummary>
            </CartContainer>

            {/* Модальное окно результатов заказа */}
            {showCheckoutModal && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>
                            <ModalTitle>
                                {loading ? 'Обработка заказа...' : 'Результат заказа'}
                            </ModalTitle>
                            <CloseButton onClick={handleCloseModal}>×</CloseButton>
                        </ModalHeader>
                        
                        <ModalBody>
                            {loading && (
                                <LoadingMessage>
                                    <Spinner />
                                    Обрабатываем ваш заказ...
                                    <LoadingSubtext>Это может занять несколько секунд</LoadingSubtext>
                                </LoadingMessage>
                            )}
                            
                            {error && (
                                <ErrorMessage>
                                    <ErrorIcon>❌</ErrorIcon>
                                    <ErrorMessageContent>
                                        <ErrorMessageTitle>Произошла ошибка</ErrorMessageTitle>
                                        <ErrorMessageText>{error}</ErrorMessageText>
                                    </ErrorMessageContent>
                                </ErrorMessage>
                            )}
                            
                            {result && (
                                <ResultsContainer>
                                    <ResultsHeader success={result.data.total_failed === 0}>
                                        <ResultsTitle>
                                            {result.data.total_failed === 0 ? '✅ Заказ успешно обработан!' : '⚠️ Заказ обработан с ошибками'}
                                        </ResultsTitle>
                                        <ResultsSummary>
                                            <SummaryItem success>
                                                Успешно: {result.data.total_processed}
                                            </SummaryItem>
                                            {result.data.total_failed > 0 && (
                                                <SummaryItem error>
                                                    Ошибок: {result.data.total_failed}
                                                </SummaryItem>
                                            )}
                                            <SummaryItem>
                                                Сумма: {convertedResultTotal !== null ? formatRubles(convertedResultTotal) : 'Загрузка...'}
                                                <OriginalAmount>
                                                    {result.data.total_amount.toFixed(2)} USD
                                                </OriginalAmount>
                                            </SummaryItem>
                                        </ResultsSummary>
                                    </ResultsHeader>
                                    
                                    <ResultsList>
                                        {result.data.results.map((item: CheckoutItemResult, index: number) => (
                                            <ResultItem key={index} success={item.success}>
                                                <ResultHeader>
                                                    <ResultService>{item.service_name}</ResultService>
                                                    <ResultStatus style={{ color: getStatusColor(item.status) }}>
                                                        {getStatusMessage(item.status)}
                                                    </ResultStatus>
                                                </ResultHeader>
                                                
                                                {item.pins && item.pins.length > 0 && (
                                                    <ResultDetails>
                                                        <ResultLabel>Коды:</ResultLabel>
                                                        <ResultPins>
                                                            {item.pins.map((pin, pinIndex) => (
                                                                <PinCode key={pinIndex}>{pin}</PinCode>
                                                            ))}
                                                        </ResultPins>
                                                    </ResultDetails>
                                                )}
                                                
                                                {item.data && (
                                                    <ResultDetails>
                                                        <ResultLabel>Данные:</ResultLabel>
                                                        <ResultData>{item.data}</ResultData>
                                                    </ResultDetails>
                                                )}
                                                
                                                {item.error && (
                                                    <ResultDetails>
                                                        <ResultLabel>Ошибка:</ResultLabel>
                                                        <ResultError>{item.error}</ResultError>
                                                    </ResultDetails>
                                                )}
                                            </ResultItem>
                                        ))}
                                    </ResultsList>
                                </ResultsContainer>
                            )}
                        </ModalBody>
                        
                        <ModalFooter>
                            {result && result.data.total_failed > 0 ? (
                                <>
                                    <ModalButton secondary onClick={handleRetryCheckout}>
                                        Исправить и повторить
                                    </ModalButton>
                                    <ModalButton onClick={handleCloseModal}>
                                        Понятно
                                    </ModalButton>
                                </>
                            ) : (
                                <ModalButton onClick={handleCloseModal}>
                                    {result ? 'Отлично!' : 'Закрыть'}
                                </ModalButton>
                            )}
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
};

export default ShopCartPage;

// Styles
const CartContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    animation: fadeIn 0.5s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const CartHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CartTitle = styled.h1`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 24px;
    margin: 0;
`;

const ClearCartButton = styled.button`
    background: rgba(255, 59, 59, 0.2);
    color: #ff3b3b;
    border: 1px solid #ff3b3b;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 59, 59, 0.3);
    }
`;

const CartItems = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
`;

const CartItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 20px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const ItemInfo = styled.div`
    flex: 1;
`;

const ItemName = styled.h3`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 18px;
    margin: 0 0 8px 0;
`;

const ItemDescription = styled.p`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    margin: 0 0 8px 0;
`;

const ItemPrice = styled.div`
    margin-top: 8px;
`;

const PriceContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const RubPrice = styled.div`
    color: #88FB47;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    font-weight: 600;
`;

const OriginalPrice = styled.div`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
`;

const DataInputContainer = styled.div`
    margin-top: 12px;
    margin-right: 10px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DataInputLabel = styled.label`
    display: block;
    color: #88FB47;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
`;

const DataInput = styled.input`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    padding: 10px 12px;
    color: white;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    box-sizing: border-box;
    
    &::placeholder {
        color: #737591;
    }
    
    &:focus {
        outline: none;
        border-color: #88FB47;
        box-shadow: 0 0 0 2px rgba(136, 251, 71, 0.2);
    }
`;

const DataInputHint = styled.span`
    display: block;
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 10px;
    margin-top: 4px;
`;

const ItemControls = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

const QuantityControl = styled.div`
    display: flex;
    align-items: center;
    background: rgba(248, 157, 9, 0.2);
    border: 1px solid #F89D09;
    border-radius: 5px;
    overflow: hidden;
`;

const QuantityButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    padding: 8px 12px;
    transition: background-color 0.3s ease;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const QuantityDisplay = styled.span`
    color: white;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    font-weight: 600;
    padding: 8px 16px;
    min-width: 40px;
    text-align: center;
`;

const RemoveButton = styled.button`
    width: 100%;
    background: rgba(255, 59, 59, 0.1);
    color: #ff3b3b;
    border: 1px solid #ff3b3b;
    border-radius: 5px;
    padding: 6px 12px;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        background: rgba(255, 59, 59, 0.2);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CartSummary = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 25px;
`;

const TotalSummary = styled.div`
    margin-bottom: 20px;
`;

const SummaryRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    &:last-child {
        margin-bottom: 0;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 18px;
        font-weight: bold;
    }
`;

const SummaryLabel = styled.span`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
`;

const SummaryValue = styled.span`
    color: #88FB47;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
`;

const OriginalTotal = styled.span`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    font-weight: normal;
`;

const CheckoutButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, #88FB47 0%, #27C151 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 16px;
    font-family: "ChakraPetch-Regular";
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(136, 251, 71, 0.3);
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        background: #737591;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
`;

const EmptyCart = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
`;

const EmptyCartIcon = styled.div`
    font-size: 64px;
    margin-bottom: 20px;
`;

const EmptyCartText = styled.h2`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 24px;
    margin: 0 0 10px 0;
`;

const EmptyCartSubtext = styled.p`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    margin: 0;
`;

// Стили для модального окна
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContent = styled.div`
    background: #1a1a2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 0;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 20px;
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #737591;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    
    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
`;

const ModalBody = styled.div`
    padding: 25px;
    max-height: 400px;
    overflow-y: auto;
`;

const ModalFooter = styled.div`
    padding: 20px 25px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
`;

const ModalButton = styled.button<{ secondary?: boolean }>`
    background: ${props => props.secondary 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'linear-gradient(135deg, #88FB47 0%, #27C151 100%)'};
    color: ${props => props.secondary ? '#fff' : 'white'};
    border: ${props => props.secondary ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'};
    border-radius: 8px;
    padding: 12px 24px;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.secondary 
            ? '0 5px 15px rgba(255, 255, 255, 0.1)' 
            : '0 5px 15px rgba(136, 251, 71, 0.3)'};
    }
`;

const LoadingMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #F89D09;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    text-align: center;
    padding: 20px;
`;

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid rgba(248, 157, 9, 0.3);
    border-top: 3px solid #F89D09;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const LoadingSubtext = styled.div`
    color: #737591;
    font-size: 14px;
`;

const ErrorMessage = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: rgba(255, 59, 59, 0.1);
    border: 1px solid rgba(255, 59, 59, 0.3);
    border-radius: 8px;
    padding: 20px;
`;

const ErrorIcon = styled.div`
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
`;

const ErrorMessageContent = styled.div`
    flex: 1;
`;

const ErrorMessageTitle = styled.div`
    color: #ff3b3b;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
`;

const ErrorMessageText = styled.div`
    color: #ff3b3b;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    line-height: 1.4;
`;

const ResultsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ResultsHeader = styled.div<{ success: boolean }>`
    background: ${props => props.success 
        ? 'rgba(136, 251, 71, 0.1)' 
        : 'rgba(248, 157, 9, 0.1)'};
    border: 1px solid ${props => props.success 
        ? 'rgba(136, 251, 71, 0.3)' 
        : 'rgba(248, 157, 9, 0.3)'};
    border-radius: 10px;
    padding: 20px;
`;

const ResultsTitle = styled.h3`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 18px;
    margin: 0 0 15px 0;
    text-align: center;
`;

const ResultsSummary = styled.div`
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
`;

const SummaryItem = styled.div<{ success?: boolean; error?: boolean }>`
    background: ${props => {
        if (props.success) return 'rgba(136, 251, 71, 0.2)';
        if (props.error) return 'rgba(255, 59, 59, 0.2)';
        return 'rgba(255, 255, 255, 0.1)';
    }};
    color: ${props => {
        if (props.success) return '#88FB47';
        if (props.error) return '#ff3b3b';
        return '#fff';
    }};
    border: 1px solid ${props => {
        if (props.success) return 'rgba(136, 251, 71, 0.3)';
        if (props.error) return 'rgba(255, 59, 59, 0.3)';
        return 'rgba(255, 255, 255, 0.2)';
    }};
    border-radius: 8px;
    padding: 10px 15px;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
`;

const OriginalAmount = styled.span`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 10px;
    font-weight: normal;
`;

const ResultsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ResultItem = styled.div<{ success: boolean }>`
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid ${props => props.success 
        ? 'rgba(136, 251, 71, 0.2)' 
        : 'rgba(255, 59, 59, 0.2)'};
    border-radius: 8px;
    padding: 15px;
`;

const ResultHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
`;

const ResultService = styled.div`
    color: #fff;
    font-family: "ChakraPetch-Regular";
    font-size: 16px;
    font-weight: 600;
`;

const ResultStatus = styled.div`
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
    font-weight: 600;
`;

const ResultDetails = styled.div`
    margin-top: 8px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
`;

const ResultLabel = styled.div`
    color: #737591;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    font-weight: 600;
    min-width: 60px;
    flex-shrink: 0;
`;

const ResultPins = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

const PinCode = styled.div`
    background: rgba(136, 251, 71, 0.1);
    color: #88FB47;
    border: 1px solid rgba(136, 251, 71, 0.3);
    border-radius: 4px;
    padding: 6px 10px;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    font-weight: 600;
    word-break: break-all;
`;

const ResultData = styled.div`
    color: #88FB47;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    flex: 1;
    word-break: break-all;
`;

const ResultError = styled.div`
    color: #ff3b3b;
    font-family: "ChakraPetch-Regular";
    font-size: 12px;
    flex: 1;
    word-break: break-all;
`;