import styled, { keyframes } from "styled-components";
import { api } from "../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import AdvImageStars from "../assets/images/stars-add.png";

import CartButton from '../components/CartButton';
import SteamTopUpModal from '../components/SteamTopUpModal';
import { useCurrency } from '../hooks/useCurrency'; // Добавляем импорт

const AllGamesPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<CategoryWithImage[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithImage | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null); // ID категории, которая загружается
    const [loadingSubcategoryName, setLoadingSubcategoryName] = useState<string | null>(null); // Название подкатегории, которая загружается
    const [isSteamTopUpModalOpen, setIsSteamTopUpModalOpen] = useState(false);
    
    // Добавляем хук для валюты
    const { convertToRub, formatRubles, loading: ratesLoading } = useCurrency();
    const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: number }>({});

    // Функция для добавления товара Steam CIS TopUp с service_id=1, если его нет
    const addSteamTopUpIfNeeded = (services: ServiceItem[], categoryName: string): ServiceItem[] => {
        console.log('addSteamTopUpIfNeeded called with categoryName:', categoryName, 'services count:', services.length);
        
        // Проверяем, что это категория Steam Wallet
        if (categoryName !== 'Steam Wallet') {
            console.log('Category is not Steam Wallet, skipping');
            return services;
        }

        // Проверяем, есть ли уже товар с service_id=1
        const hasSteamTopUp = services.some(service => service.service_id === 1);
        
        if (hasSteamTopUp) {
            console.log('Steam TopUp already exists in services');
            return services;
        }

        // Создаем искусственный товар Steam CIS TopUp
        const steamTopUpItem: ServiceItem = {
            service_id: 1,
            service_name: 'Steam CIS TopUp',
            service_description: 'Пополнение Steam Wallet для стран СНГ',
            price: 0, // Цена будет определяться пользователем
            currency: 'USD',
            in_stock: 999, // Всегда в наличии
            available: true,
        };

        // Добавляем товар первым в списке
        const newServices = [steamTopUpItem, ...services];
        console.log('Adding Steam CIS TopUp item to Steam Wallet category, new services count:', newServices.length);
        console.log('First service in list:', newServices[0]?.service_id, newServices[0]?.service_name);
        return newServices;
    };

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
                        const rubPrice = await convertToRub(
                            Number(service.price.toFixed(2)), 
                            service.currency || 'USD'
                        );
                        converted[service.service_id] = Math.ceil(rubPrice);
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
        // Не показываем цену для товара с service_id=1 (Steam CIS TopUp)
        if (service.service_id === 1) return null;
        
        if (!service.price) return null;

        const rubPrice = convertedPrices[service.service_id];
        
        if (rubPrice) {
            return (
                <ServicePrice>
                    <RubPrice>{formatRubles(rubPrice)}</RubPrice>
                    {/* <OriginalPrice>
                        {service.price} {service.currency || 'USD'}
                    </OriginalPrice> */}
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
        if (isModalOpen || isServicesModalOpen || isSteamTopUpModalOpen) {
            disableScroll();
        } else {
            enableScroll();
        }

        // Cleanup function - восстанавливаем скролл при размонтировании компонента
        return () => {
            enableScroll();
        };
    }, [isModalOpen, isServicesModalOpen, isSteamTopUpModalOpen]);

    const handleCategoryClick = async (category: CategoryWithImage) => {
        // Проверяем, есть ли у категории подкатегории
        if (category.subcategories && category.subcategories.length > 0) {
            // Если есть подкатегории, показываем модальное окно с подкатегориями
            setSelectedCategory(category);
            setIsModalOpen(true);
        } else if (category.categoryIds && category.categoryIds.length > 0) {
            // Если нет подкатегорий, но есть categoryIds, загружаем товары из всех этих категорий
            try {
                setLoading(true);
                setLoadingCategoryId(category.id); // Устанавливаем ID категории, которая загружается
                setSelectedCategory(category);
                setConvertedPrices({}); // Сбрасываем конвертированные цены
                
                // Загружаем товары для всех категорий
                const allServices: ServiceItem[] = [];
                
                // Загружаем товары для каждой категории параллельно
                const servicePromises = category.categoryIds.map(categoryId => 
                    api.get<ServicesResponse>('/gifts/services/by-category', {
                        params: { category_id: categoryId }
                    }).then(response => response.data.data)
                );
                
                const servicesArrays = await Promise.all(servicePromises);
                
                // Объединяем все товары в один массив
                servicesArrays.forEach(services => {
                    allServices.push(...services);
                });
                
                // Удаляем дубликаты по service_id и фильтруем по наличию
                let uniqueServices = Array.from(
                    new Map(allServices.map(service => [service.service_id, service])).values()
                )
                .filter((item) => item.in_stock !== 0)
                .sort((el1, el2) => el1.service_id - el2.service_id);
                
                // Добавляем товар Steam CIS TopUp, если это категория Steam Wallet
                console.log('handleCategoryClick - Processing category:', category.name, 'services count before:', uniqueServices.length);
                uniqueServices = addSteamTopUpIfNeeded(uniqueServices, category.name);
                
                // Дополнительная проверка для Steam Wallet
                if (category.name === 'Steam Wallet' && !uniqueServices.some(s => s.service_id === 1)) {
                    console.warn('WARNING: Steam TopUp not found after addSteamTopUpIfNeeded in handleCategoryClick! Force adding...');
                    const steamTopUpItem: ServiceItem = {
                        service_id: 1,
                        service_name: 'Steam CIS TopUp',
                        service_description: 'Пополнение Steam Wallet для стран СНГ',
                        price: 0,
                        currency: 'USD',
                        in_stock: 999,
                        available: true,
                    };
                    uniqueServices = [steamTopUpItem, ...uniqueServices];
                }
                
                console.log('After adding Steam TopUp, services count:', uniqueServices.length, 'first item:', uniqueServices[0]?.service_id, uniqueServices[0]?.service_name);
                
                setServices(uniqueServices);
                setIsServicesModalOpen(true);
            } catch (error) {
                console.error('Error fetching services:', error);
                alert('Ошибка при загрузке товаров');
            } finally {
                setLoading(false);
                setLoadingCategoryId(null); // Сбрасываем ID категории после загрузки
            }
        } else {
            // Fallback для старой логики (если categoryIds не определен)
            setSelectedCategory(category);
            if (category.tags.length === 0) {
                handleCountrySelect(category.id.toString(), category.id);
                return;
            }
            setIsModalOpen(true);
        }
    };

    // Функция для извлечения кода страны из названия подкатегории
    const extractCountryCode = (subcategoryName: string): string | null => {
        // Паттерны для извлечения кода страны:
        // 1. amazon.ae, amazon.au и т.д. -> извлекаем код после точки
        // 2. Apple Gift Card | AU -> извлекаем код после |
        // 3. Battle.net Gift Card | BR -> извлекаем код после |
        // 4. И другие варианты
        
        const name = subcategoryName.trim();
        
        // Маппинг специальных кодов к стандартным кодам стран
        const countryCodeMap: Record<string, string> = {
            'USA': 'US',
            'UK': 'UK',
            'TRY': 'TR',
            'ZAR': 'ZA',
            'PLN': 'PL',
            'INR': 'IN',
            'USD': 'US' // USD обычно означает США
        };
        
        // Коды, которые НЕ являются странами (регионы, платформы и т.д.)
        const nonCountryCodes = ['GLOB', 'CIS', 'LATAM', 'MENA', 'ASIA', 'ROW', 'GL'];
        
        // Паттерн 1: amazon.ae, amazon.au и т.д.
        const amazonPattern = /^amazon\.([a-z]{2})/i;
        const amazonMatch = name.match(amazonPattern);
        if (amazonMatch) {
            const code = amazonMatch[1].toUpperCase();
            // Проверяем, что это не специальный код
            if (!nonCountryCodes.includes(code)) {
                return code;
            }
        }
        
        // Паттерн 2: Название | GLOB | Platform -> пропускаем GLOB
        const globPattern = /\|\s*GLOB\s*\|\s*([A-Z\s]+)$/;
        if (globPattern.test(name)) {
            return null; // Глобальные категории без флага
        }
        
        // Паттерн 3: Название | КОД (но не GLOB, CIS и т.д.)
        const pipePattern = /\|\s*([A-Z]{2,5})(?:\s|$)/;
        const pipeMatch = name.match(pipePattern);
        if (pipeMatch) {
            let code = pipeMatch[1].toUpperCase();
            // Проверяем маппинг специальных кодов
            if (countryCodeMap[code]) {
                code = countryCodeMap[code];
            }
            // Проверяем, что это не специальный код региона/платформы
            if (!nonCountryCodes.includes(code)) {
                return code;
            }
        }
        
        // Паттерн 4: Проверяем, есть ли двухбуквенный код в конце или после пробела
        const endCodePattern = /\s([A-Z]{2,5})(?:\s|$)/;
        const endMatch = name.match(endCodePattern);
        if (endMatch) {
            let code = endMatch[1].toUpperCase();
            // Проверяем маппинг специальных кодов
            if (countryCodeMap[code]) {
                code = countryCodeMap[code];
            }
            // Проверяем, что это валидный код страны и не специальный код
            const validCountryCodes = ['RU', 'US', 'GB', 'EU', 'BR', 'JP', 'IN', 'AU', 'CA', 'MX', 'DE', 'FR', 'IT', 'ES', 'PL', 'TR', 'AE', 'SA', 'ID', 'PH', 'TH', 'VN', 'SG', 'MY', 'HK', 'KR', 'CN', 'NZ', 'ZA', 'CO', 'PT', 'IE', 'BE', 'AT', 'CZ', 'FI', 'GR', 'HR', 'LU', 'NL', 'OM', 'RO', 'SK', 'BH', 'KW', 'QA', 'LB', 'DZ'];
            if (validCountryCodes.includes(code) && !nonCountryCodes.includes(code)) {
                return code;
            }
        }
        
        return null;
    };

    const handleSubcategoryClick = async (subcategoryName: string, categoryId: number | undefined) => {
        if (!categoryId) {
            alert('Категория не найдена');
            return;
        }

        try {
            setLoading(true);
            setLoadingSubcategoryName(subcategoryName); // Устанавливаем загружаемую подкатегорию
            setSelectedSubcategory(subcategoryName); // Сохраняем выбранную подкатегорию
            setConvertedPrices({}); // Сбрасываем конвертированные цены
            
            // Получаем сервисы по category_id подкатегории
            const response = await api.get<ServicesResponse>('/gifts/services/by-category', {
                params: { category_id: categoryId }
            });
            
            let services = response.data.data.sort((el1, el2) => el1.service_id - el2.service_id).filter((item) => item.in_stock !== 0);
            
            // Добавляем товар Steam CIS TopUp для всех подкатегорий Steam Wallet
            // Проверяем по selectedCategory или по названию подкатегории (все подкатегории Steam Wallet содержат "Steam" или "Steam Wallet")
            const isSteamWallet = (selectedCategory && selectedCategory.name === 'Steam Wallet') || 
                                   subcategoryName.toLowerCase().includes('steam');
            
            console.log('handleSubcategoryClick - subcategoryName:', subcategoryName, 'selectedCategory:', selectedCategory?.name, 'isSteamWallet:', isSteamWallet, 'services before:', services.length);
            
            // ВСЕГДА добавляем товар для всех подкатегорий Steam Wallet
            if (isSteamWallet) {
                console.log('Adding Steam TopUp for Steam Wallet subcategory:', subcategoryName);
                const servicesBefore = services.length;
                services = addSteamTopUpIfNeeded(services, 'Steam Wallet');
                console.log('Services after adding Steam TopUp:', services.length, 'was:', servicesBefore);
                console.log('First service:', services[0]?.service_id, services[0]?.service_name);
            } else {
                console.log('NOT adding Steam TopUp - subcategory:', subcategoryName, 'selectedCategory:', selectedCategory?.name);
            }
            
            // Финальная проверка: убеждаемся, что товар с service_id=1 есть в списке для Steam Wallet
            if (isSteamWallet && !services.some(s => s.service_id === 1)) {
                console.warn('WARNING: Steam TopUp item not found after adding! Forcing add...');
                const steamTopUpItem: ServiceItem = {
                    service_id: 1,
                    service_name: 'Steam CIS TopUp',
                    service_description: 'Пополнение Steam Wallet для стран СНГ',
                    price: 0,
                    currency: 'USD',
                    in_stock: 999,
                    available: true,
                };
                services = [steamTopUpItem, ...services];
                console.log('Force added Steam TopUp, new count:', services.length);
            }
            
            console.log('Final services array:', services.length, 'items. First item:', services[0]?.service_id, services[0]?.service_name);
            setServices(services);
            setIsServicesModalOpen(true);
            setIsModalOpen(false); // Закрываем модальное окно с подкатегориями
        } catch (error) {
            console.error('Error fetching services:', error);
            alert('Ошибка при загрузке сервисов');
        } finally {
            setLoading(false);
            setLoadingCategoryId(null);
            setLoadingSubcategoryName(null); // Сбрасываем загружаемую подкатегорию
        }
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
            
            let services = response.data.data.sort((el1, el2) => el1.service_id - el2.service_id).filter((item) => item.in_stock !== 0);
            
            // Добавляем товар Steam CIS TopUp, если выбранная категория - Steam Wallet
            console.log('handleCountrySelect - selectedCategory:', selectedCategory?.name, 'tag:', tag);
            if (selectedCategory && selectedCategory.name === 'Steam Wallet') {
                console.log('Adding Steam TopUp for Steam Wallet in handleCountrySelect');
                services = addSteamTopUpIfNeeded(services, 'Steam Wallet');
                // Дополнительная проверка
                if (!services.some(s => s.service_id === 1)) {
                    console.warn('WARNING: Steam TopUp not found after addSteamTopUpIfNeeded in handleCountrySelect!');
                    const steamTopUpItem: ServiceItem = {
                        service_id: 1,
                        service_name: 'Steam CIS TopUp',
                        service_description: 'Пополнение Steam Wallet для стран СНГ',
                        price: 0,
                        currency: 'USD',
                        in_stock: 999,
                        available: true,
                    };
                    services = [steamTopUpItem, ...services];
                }
            }
            
            console.log('handleCountrySelect final services:', services.length, 'first:', services[0]?.service_id);
            setServices(services);
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
        setSelectedSubcategory(null);
        setLoadingSubcategoryName(null); // Сбрасываем загружаемую подкатегорию при закрытии
    };

    const closeServicesModal = () => {
        setIsServicesModalOpen(false);
        setServices([]);
        setConvertedPrices({}); // Очищаем конвертированные цены при закрытии
        setSelectedCategory(null); // Очищаем выбранную категорию
        setSelectedSubcategory(null); // Очищаем выбранную подкатегорию
        setLoadingSubcategoryName(null); // Очищаем загружаемую подкатегорию
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
                    <AdvBlocks>
                        <AdvBlock onClick={() => window.open('https://t.me/VPNos_bot', '_blank')}>
                            <AdvStyledImage src={AdvImage} alt="AdvImage" />
                            <InfoAdvBlock>
                                <AdvTitle>osVPN | Быстрый и Надежный VPN</AdvTitle>
                                <AdvAbout>🛡 Самый быстрый и безопасный VPN-сервис прямо в Телеграме!</AdvAbout>
                            </InfoAdvBlock>
                        </AdvBlock>
                        <AdvBlock onClick={() => navigate('/telegram-stars')}>
                            <AdvStyledImage src={AdvImageStars} alt="AdvImageStars" />
                            <InfoAdvBlock>
                                <AdvTitle>osSTARS | Звезды и Премиум</AdvTitle>
                                <AdvAbout>🌟 Самые выгодные цены на Telegram Stars и Telegram Premium только здесь!</AdvAbout>
                            </InfoAdvBlock>
                        </AdvBlock>
                    </AdvBlocks>
                    <CategoriesGrid>
                        {/* {categories.filter((category) => category.tags.length > 0).map((category) => ( */}
                        {categories.map((category) => (
                            <CategoryCard 
                                key={category.id} 
                                onClick={() => handleCategoryClick(category)}
                                $isLoading={loadingCategoryId === category.id}
                            >
                                <CategoryImage 
                                    src={`/assets/images/Gifts/${category.image}.png`} 
                                    alt={category.name}
                                    onError={(e) => {
                                        e.currentTarget.src = '/assets/images/Gifts/games_pc_mac.png';
                                    }}
                                    $isLoading={loadingCategoryId === category.id}
                                />
                                {loadingCategoryId === category.id && (
                                    <LoadingOverlay>
                                        <CategorySpinner />
                                    </LoadingOverlay>
                                )}
                                <CategoryInfo>
                                    <CategoryName>{category.name}</CategoryName>
                                </CategoryInfo>
                            </CategoryCard>
                        ))}
                    </CategoriesGrid>
                </div>
            )}

            {/* Модальное окно для выбора подкатегории или региона */}
            {isModalOpen && selectedCategory && (
                <ModalOverlay onClick={closeModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                {selectedCategory.subcategories && selectedCategory.subcategories.length > 0
                                    ? `Выберите подкатегорию - ${selectedCategory.name}`
                                    : `Выберите регион - ${selectedCategory.name}`
                                }
                            </ModalTitle>
                            <CloseButton onClick={closeModal}>×</CloseButton>
                        </ModalHeader>
                        
                        <ModalBody>
                            {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                                <CountriesList>
                                    {selectedCategory.subcategories.map((subcategory, index) => {
                                        const countryCode = extractCountryCode(subcategory.name);
                                        const isLoading = loadingSubcategoryName === subcategory.name;
                                        
                                        return (
                                            <CountryItem 
                                                key={`${subcategory.name}-${index}`}
                                                onClick={() => handleSubcategoryClick(subcategory.name, subcategory.categoryId)}
                                                $disabled={!subcategory.categoryId || isLoading}
                                                $isLoading={isLoading}
                                            >
                                                <CategoryImageContainer>
                                                    <SubcategoryImage 
                                                        src={`/assets/images/Gifts/${selectedCategory.image}.png`}
                                                        alt={selectedCategory.name}
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/assets/images/Gifts/games_pc_mac.png';
                                                        }}
                                                    />
                                                </CategoryImageContainer>
                                                {countryCode && (
                                                    <SubcategoryFlagContainer>
                                                        <CountryFlag countryCode={countryCode} size={16} />
                                                    </SubcategoryFlagContainer>
                                                )}
                                                <CountryName>{subcategory.name}</CountryName>
                                                {isLoading ? (
                                                    <SubcategorySpinner />
                                                ) : (
                                                    subcategory.categoryId && <CountryArrow>→</CountryArrow>
                                                )}
                                            </CountryItem>
                                        );
                                    })}
                                    
                                    {selectedCategory.subcategories.length === 0 && (
                                        <EmptyMessage>
                                            Нет доступных подкатегорий
                                        </EmptyMessage>
                                    )}
                                </CountriesList>
                            ) : (
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
                            )}
                        </ModalBody>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Модальное окно для выбора сервиса */}
            {isServicesModalOpen && (
                <ModalOverlay onClick={closeServicesModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                {selectedSubcategory 
                                    ? `${selectedSubcategory}` 
                                    : selectedCategory 
                                        ? `${selectedCategory.name}` 
                                        : 'Доступные товары'
                                }
                            </ModalTitle>
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
                                            {service.service_id === 1 ? (
                                                <SteamTopUpButton onClick={() => setIsSteamTopUpModalOpen(true)}>
                                                    Пополнить
                                                </SteamTopUpButton>
                                            ) : (
                                                <CartButton service={service} />
                                            )}
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

            {/* Модальное окно для пополнения Steam Wallet */}
            <SteamTopUpModal
                isOpen={isSteamTopUpModalOpen}
                onClose={() => setIsSteamTopUpModalOpen(false)}
                onSuccess={() => {
                    // Можно обновить данные или показать уведомление
                }}
            />
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
const AdvBlocks = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
`

const AdvBlock = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    border: 0.5px solid #C0C0C0;
    border-radius: 14px;
    box-sizing: border-box;
    padding: 3px;
    cursor: pointer;

    min-width: 320px;
    max-width: 500px;

    margin-left: auto;
    margin-right: auto;
`

const AdvStyledImage = styled.img`
    max-width: 100px;
    max-height: 100px;
    border-radius: 14px;
    margin: 5px;
    margin-right: 10px;
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

const CategoryCard = styled.div<{ $isLoading?: boolean }>`
    background: rgba(255, 255, 255, 1);
    border-radius: 12px;
    text-align: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: ${props => props.$isLoading ? 'wait' : 'pointer'};
    flex: 1 0 45%;
    box-sizing: border-box;

    overflow: hidden;
    max-height: 190px;
    max-width: 190px;
    aspect-ratio: 1;

    &:hover {
        transform: ${props => props.$isLoading ? 'none' : 'translateY(-5px)'};
        background: ${props => props.$isLoading ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.15)'};
        box-shadow: ${props => props.$isLoading ? 'none' : '0 10px 25px rgba(0, 0, 0, 0.2)'};
    }

    position: relative;
    opacity: ${props => props.$isLoading ? 0.7 : 1};
`;

const CategoryImage = styled.img<{ $isLoading?: boolean }>`
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
    opacity: ${props => props.$isLoading ? 0.5 : 1};
    transition: opacity 0.3s ease;
`;

const LoadingOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    border-radius: 12px;
    z-index: 10;
`;

const CategorySpinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid rgba(136, 251, 71, 0.3);
    border-top: 3px solid #88FB47;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
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

const CountryItem = styled.div<{ $disabled?: boolean; $isLoading?: boolean }>`
    display: flex;
    align-items: center;
    padding: 16px 24px;
    cursor: ${props => (props.$disabled || props.$isLoading) ? 'not-allowed' : 'pointer'};
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    opacity: ${props => (props.$disabled || props.$isLoading) ? 0.7 : 1};
    position: relative;

    &:hover {
        background: ${props => (props.$disabled || props.$isLoading) ? 'transparent' : 'rgba(255, 255, 255, 0.05)'};
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

const CategoryImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 1);
`;

const SubcategoryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SubcategoryFlagContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  width: 20px;
  height: 15px;
  flex-shrink: 0;
  border-radius: 2px;
  overflow: hidden;
`;

const SubcategorySpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(136, 251, 71, 0.3);
  border-top: 2px solid #88FB47;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-left: auto;
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

const SteamTopUpButton = styled.button`
    background: #88FB47;
    color: #1a1a2e;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-family: "ChakraPetch-Regular";
    font-size: 14px;
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