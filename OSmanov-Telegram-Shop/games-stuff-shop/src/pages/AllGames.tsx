import styled, { keyframes } from "styled-components";
import { api } from "../api";
import { useEffect, useState } from "react";
// Types
import type {  
  GiftsCategories, 
  CategoryWithImage, 
  ServiceItem,
  ServicesResponse 
} from "../types/api.types";
import { groupCategories } from "../utils/categoryUtils";
import { CountryFlag } from "../utils/countryFlags";
import AdvImage from "../assets/images/vpn-add.png";

import CartButton from '../components/CartButton';
import { useCurrency } from '../hooks/useCurrency'; // Добавляем импорт

const AllGamesPage: React.FC = () => {
    const [categories, setCategories] = useState<CategoryWithImage[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithImage | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    
    // Добавляем хук для валюты
    const { convertToRub, formatRubles, loading: ratesLoading } = useCurrency();
    const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const response = await api.get<GiftsCategories>('/gifts/categories');
                const groupedCategories = groupCategories(response.data.data);
                setCategories(groupedCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
        }

        fetchCategories();
    }, []);

    // Эффект для конвертации цен сервисов
    useEffect(() => {
        const convertServicePrices = async () => {
            if (!services.length || ratesLoading) return;

            const converted: { [key: string]: number } = {};
            
            for (const service of services) {
                if (service.price) {
                    try {
                        const rubPrice = await convertToRub(service.price, service.currency || 'USD');
                        converted[service.service_id] = rubPrice;
                    } catch (err) {
                        console.error(`Error converting price for service ${service.service_id}:`, err);
                        // Fallback на примерный курс
                        converted[service.service_id] = service.price * 90;
                    }
                }
            }
            
            setConvertedPrices(converted);
        };

        convertServicePrices();
    }, [services, convertToRub, ratesLoading]);

    // Функция для отображения цены
    const renderPrice = (service: ServiceItem) => {
        if (!service.price) return null;

        const rubPrice = convertedPrices[service.service_id];
        
        if (rubPrice) {
            return (
                <ServicePrice>
                    <RubPrice>{formatRubles(rubPrice)}</RubPrice>
                    <OriginalPrice>
                        {service.price} {service.currency || 'USD'}
                    </OriginalPrice>
                </ServicePrice>
            );
        } else {
            return (
                <ServicePrice>
                    <OriginalPrice>
                        {service.price} {service.currency || 'USD'}
                    </OriginalPrice>
                    {ratesLoading && <PriceLoading>...</PriceLoading>}
                </ServicePrice>
            );
        }
    };

    // Функция для блокировки скролла
    const disableScroll = () => {
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollBarWidth}px`;
    };

    // Функция для разблокировки скролла
    const enableScroll = () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    // Эффект для управления скроллом при открытии/закрытии модальных окон
    useEffect(() => {
        if (isModalOpen || isServicesModalOpen) {
            disableScroll();
        } else {
            enableScroll();
        }

        // Cleanup function - восстанавливаем скролл при размонтировании компонента
        return () => {
            enableScroll();
        };
    }, [isModalOpen, isServicesModalOpen]);

    const handleCategoryClick = (category: CategoryWithImage) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleCountrySelect = async (tag: string, tagID: number) => {
        console.log(`Selected country: ${tag} with ID: ${tagID}`);
        
        try {
            setLoading(true);
            setConvertedPrices({}); // Сбрасываем конвертированные цены
            
            // Получаем сервисы по category_id (tagID)
            const response = await api.get<ServicesResponse>('/gifts/services/by-category', {
                params: { category_id: tagID }
            });
            
            setServices(response.data.data.sort((el1, el2) => el1.service_id - el2.service_id).filter((item) => item.in_stock !== 0));
            setIsServicesModalOpen(true);
        } catch (error) {
            console.error('Error fetching services:', error);
            alert('Ошибка при загрузке сервисов');
        } finally {
            setLoading(false);
            setIsModalOpen(false);
            setSelectedCategory(null);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const closeServicesModal = () => {
        setIsServicesModalOpen(false);
        setServices([]);
        setConvertedPrices({}); // Очищаем конвертированные цены при закрытии
    };

    return (
        <>
            {categoriesLoading ? (
                <LoadingContainer>
                    <Spinner />
                    <LoadingText>Загрузка категорий...</LoadingText>
                </LoadingContainer>
            ) : (
                <div>
                    <AdvBlock onClick={() => window.open('https://t.me/VPNos_bot', '_blank')}>
                        <img src={AdvImage} alt="AdvImage" />
                        <InfoAdvBlock>
                            <AdvTitle>osVPN | Быстрый и Надежный VPN</AdvTitle>
                            <AdvAbout>🛡 Самый быстрый и безопасный VPN-сервис прямо в Телеграме!</AdvAbout>
                        </InfoAdvBlock>
                    </AdvBlock>
                    <CategoriesGrid>
                        {categories.filter((category) => category.tags.length > 0).map((category) => (
                            <CategoryCard 
                                key={category.id} 
                                onClick={() => handleCategoryClick(category)}
                            >
                                <CategoryImage 
                                    src={`/assets/images/Gifts/${category.image}.png`} 
                                    alt={category.name}
                                    onError={(e) => {
                                        e.currentTarget.src = '/assets/images/Gifts/games_pc_mac.png';
                                    }}
                                />
                                <CategoryInfo>
                                    <CategoryName>{category.name}</CategoryName>
                                </CategoryInfo>
                            </CategoryCard>
                        ))}
                    </CategoriesGrid>
                </div>
            )}

            {/* Модальное окно для выбора страны */}
            {isModalOpen && selectedCategory && (
                <ModalOverlay onClick={closeModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>Выберите регион - {selectedCategory.name}</ModalTitle>
                            <CloseButton onClick={closeModal}>×</CloseButton>
                        </ModalHeader>
                        
                        <ModalBody>
                            <CountriesList>
                                {selectedCategory.tags.map((tag, index) => (
                                    <CountryItem 
                                        key={selectedCategory.tagIDs[index]}
                                        onClick={() => handleCountrySelect(tag, selectedCategory.tagIDs[index])}
                                    >
                                        <CountryFlagContainer>
                                            <CountryFlag countryCode={tag} size={20} />
                                        </CountryFlagContainer>
                                        <CountryName>{tag}</CountryName>
                                        <CountryArrow>→</CountryArrow>
                                    </CountryItem>
                                ))}
                                
                                {selectedCategory.tags.length === 0 && (
                                    <EmptyMessage>
                                        Нет доступных регионов
                                    </EmptyMessage>
                                )}
                            </CountriesList>
                        </ModalBody>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Модальное окно для выбора сервиса */}
            {isServicesModalOpen && (
                <ModalOverlay onClick={closeServicesModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>Доступные сервисы</ModalTitle>
                            <CloseButton onClick={closeServicesModal}>×</CloseButton>
                        </ModalHeader>
                        
                        <ModalBody>
                            {loading ? (
                                <LoadingContainer>
                                    <Spinner />
                                    <LoadingText>Загрузка сервисов...</LoadingText>
                                </LoadingContainer>
                            ) : services.length > 0 ? (
                                <ServicesList>
                                    {services.map((service) => (
                                        <ServiceItem key={service.service_id}>
                                            <ServiceInfo>
                                                <ServiceName>{service.service_name}</ServiceName>
                                                {service.service_description && (
                                                    <ServiceDescription>
                                                        {service.service_description}
                                                    </ServiceDescription>
                                                )}
                                                {renderPrice(service)}
                                            </ServiceInfo>
                                            <CartButton service={service} />
                                        </ServiceItem>
                                    ))}
                                </ServicesList>
                            ) : (
                                <EmptyMessage>
                                    Нет доступных сервисов
                                </EmptyMessage>
                            )}
                        </ModalBody>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    )
}

export default AllGamesPage;

// Анимации
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// const pulse = keyframes`
//   0% { opacity: 1; }
//   50% { opacity: 0.5; }
//   100% { opacity: 1; }
// `;

// const shimmer = keyframes`
//   0% { background-position: -200px 0; }
//   100% { background-position: 200px 0; }
// `;

// Стили для анимации загрузки
const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
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
    text-align: center;
`;

// const SkeletonLoader = styled.div`
//     background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
//     background-size: 200px 100%;
//     animation: ${shimmer} 1.5s infinite;
//     border-radius: 8px;
// `;

// // Альтернативный вариант скелетона для категорий
// const CategorySkeleton = styled(SkeletonLoader)`
//     width: 190px;
//     height: 190px;
//     border-radius: 12px;
// `;

// // Альтернативный вариант: пульсирующая анимация
// const PulseLoader = styled.div`
//     animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
// `;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styles

// const ServiceArrow = styled.span`
//     color: #88FB47;
//     font-size: 18px;
//     font-weight: bold;
//     margin-left: 12px;
// `;

const ServicePrice = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
`;

const RubPrice = styled.span`
    color: #88FB47;
    font-size: 14px;
    font-weight: 600;
    font-family: "ChakraPetch-Regular";
`;

const OriginalPrice = styled.span`
    color: #737591;
    font-size: 12px;
    font-family: "ChakraPetch-Regular";
`;

const PriceLoading = styled.span`
    color: #737591;
    font-size: 12px;
    font-family: "ChakraPetch-Regular";
    font-style: italic;
`;

// Остальные стили остаются без изменений:
const AdvBlock = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    border: 0.5px solid #C0C0C0;
    border-radius: 14px;
    box-sizing: border-box;
    padding: 3px;
    margin-bottom: 24px;
    cursor: pointer;

    min-width: 320px;
    max-width: 500px;

    margin-left: auto;
    margin-right: auto;
`
const InfoAdvBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: center;
`;
const AdvTitle = styled.span`
    font-family: "Jura-Regular";
    font-size: 14px;
    color: #fff;
    font-weight: 700;
`;
const AdvAbout = styled.span`
    font-family: "Jura-Regular";
    font-size: 12px;
    color: #fff;
`;

const CategoriesGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    max-width: var(--max-window-width);
    margin: 0 auto;
    justify-content: center;
    margin-left: auto;
    margin-right: auto;
    animation: ${fadeIn} 0.5s ease-out;
`;

const CategoryCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    flex: 1 0 45%;
    box-sizing: border-box;

    overflow: hidden;
    max-height: 190px;
    max-width: 190px;
    aspect-ratio: 1;

    &:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    position: relative;
`;

const CategoryImage = styled.img`
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
`;

const CategoryInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;

    position: absolute;
    top: 8px;
    left: 6px;
`;

const CategoryName = styled.span`
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    font-family: "ChakraPetch-Regular";

    padding: 4px 12px;
    backdrop-filter: blur(24px);
    border-radius: 100px;
    background: rgba(0, 0, 0, 25%);

    max-width: 150px;
    box-sizing: border-box;
`;

// Стили для модального окна
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
    z-index: 1000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 20px;
    padding: 0;
    max-width: 400px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    font-family: "ChakraPetch-Regular";
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const ModalBody = styled.div`
    padding: 0;
    max-height: 60vh;
    overflow-y: auto;
`;

const CountriesList = styled.div`
    display: flex;
    flex-direction: column;
`;

const CountryItem = styled.div`
    display: flex;
    align-items: center;
    padding: 16px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    &:last-child {
        border-bottom: none;
    }
`;

const CountryFlagContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  width: 24px;
  height: 18px;
`;

const CountryName = styled.span`
    color: #fff;
    font-size: 16px;
    font-family: "ChakraPetch-Regular";
    flex: 1;
`;

const CountryArrow = styled.span`
    color: #88FB47;
    font-size: 18px;
    font-weight: bold;
`;

const EmptyMessage = styled.div`
    color: #737591;
    text-align: center;
    padding: 40px 24px;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
`;

const ServicesList = styled.div`
    display: flex;
    flex-direction: column;
`;

const ServiceItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    &:last-child {
        border-bottom: none;
    }
`;

const ServiceInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

const ServiceName = styled.span`
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    font-family: "ChakraPetch-Regular";
`;

const ServiceDescription = styled.span`
    color: #737591;
    font-size: 14px;
    font-family: "ChakraPetch-Regular";
`;