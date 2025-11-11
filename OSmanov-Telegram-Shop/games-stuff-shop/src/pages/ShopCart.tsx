import React from 'react';
import styled from 'styled-components';
import { useCart } from '../context/CartContext';

const ShopCartPage: React.FC = () => {
    const { state, updateQuantity, removeItem, clearCart } = useCart();
    const { items, total } = state;

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

    const handleCheckout = () => {
        if (items.length === 0) return;
        
        // Здесь будет логика оформления заказа
        alert('Функционал оформления заказа в разработке!');
    };

    if (items.length === 0) {
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
                                {item.price} {item.currency || 'USD'} × {item.quantity} = 
                                <TotalPrice> {((item.price || 0) * item.quantity).toFixed(2)} {item.currency || 'USD'}</TotalPrice>
                            </ItemPrice>
                        </ItemInfo>
                        
                        <ItemControls>
                            <QuantityControl>
                                <QuantityButton 
                                    onClick={() => handleQuantityChange(item.service_id, item.quantity - 1)}
                                >
                                    -
                                </QuantityButton>
                                <QuantityDisplay>{item.quantity}</QuantityDisplay>
                                <QuantityButton 
                                    onClick={() => handleQuantityChange(item.service_id, item.quantity + 1)}
                                >
                                    +
                                </QuantityButton>
                            </QuantityControl>
                            <RemoveButton onClick={() => handleRemoveItem(item.service_id)}>
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
                        <SummaryValue>{total.toFixed(2)} USD</SummaryValue>
                    </SummaryRow>
                </TotalSummary>
                
                <CheckoutButton onClick={handleCheckout}>
                    Купить
                </CheckoutButton>
            </CartSummary>
        </CartContainer>
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
    color: #88FB47;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
`;

const TotalPrice = styled.span`
    font-weight: bold;
    margin-left: 5px;
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

    &:hover {
        background: rgba(255, 255, 255, 0.1);
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

    &:hover {
        background: rgba(255, 59, 59, 0.2);
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

    &:hover {
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