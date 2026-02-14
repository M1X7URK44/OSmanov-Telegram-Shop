// utils/categoryUtils.ts
import type { GiftCategory, SubcategoryInfo } from '../types/api.types';
import { getCategoryImage } from './categoryMapper';
import { getSubcategories, hasSubcategories, findApiCategoryByName } from './subcategories';

// Определяем основные категории, которые должны отображаться на главной странице
export const MAIN_CATEGORIES = [
  'Amazon Gift Card',
  'Apple Gift Card',
  'Battle.net',
  'EA App',
  'EA Gift Card',
  'Games | PC/Mac',
  'Google Play Gift Card',
  'League of Legends',
  'Mobile Games Donation',
  'Music & Streaming',
  'Nintendo Gift Card',
  'Playstation Gift Card',
  'Razer Gold Gift Card',
  'Riot Cash Card',
  'Roblox',
  'Rockstar Games',
  'Social Network',
  'Steam Games',
  'Steam Wallet',
  'Valorant',
  'Xbox Games',
  'Xbox Gift Card',
  'Xbox Subscriptions'
] as const;

// Функция для определения, к какой основной категории относится API категория
const mapApiCategoryToMainCategory = (categoryName: string): string | null => {
  const lowerName = categoryName.toLowerCase();
  // const originalName = categoryName;
  
  // Steam Games (проверяем ПЕРВЫМ, так как это специфичная категория)
  // Должны включать все категории, которые содержат "Steam Games" или "| Steam Games" в конце
  if (lowerName.includes('| steam games') || lowerName.includes('steam games |') || 
      (lowerName.includes('steam games') && !lowerName.includes('steam wallet'))) {
    return 'Steam Games';
  }
  
  // Steam Wallet (проверяем после Steam Games)
  // Включает "Steam Wallet Code", "Steam CIS TopUp" и т.д.
  if (lowerName.includes('steam wallet') || lowerName.includes('steam wallet code') || 
      lowerName.includes('steam cis topup') || (lowerName.includes('steam') && !lowerName.includes('steam games'))) {
    return 'Steam Wallet';
  }
  
  // Xbox Subscriptions (проверяем ПЕРВЫМ для Xbox, так как это специфичная категория)
  if (lowerName.includes('xbox game pass') || lowerName.includes('xbox subscriptions') || 
      lowerName.includes('xbox game pass core') || lowerName.includes('xbox game pass for pc') || 
      lowerName.includes('xbox game pass ultimate')) {
    return 'Xbox Subscriptions';
  }
  
  // Xbox Games (проверяем перед Xbox Gift Card)
  // Должны включать категории с "| GLOB | Xbox Games" или "Xbox Games/add-ons"
  if (lowerName.includes('| glob | xbox games') || lowerName.includes('xbox games/add-ons') || 
      lowerName.includes('| xbox games') || (lowerName.includes('xbox games') && !lowerName.includes('xbox gift card'))) {
    return 'Xbox Games';
  }
  
  // Xbox Gift Card (проверяем в последнюю очередь для Xbox)
  if (lowerName.includes('xbox gift card') || (lowerName.includes('xbox') && 
      !lowerName.includes('xbox games') && !lowerName.includes('xbox game pass') && 
      !lowerName.includes('xbox subscriptions'))) {
    return 'Xbox Gift Card';
  }
  
  // EA App (проверяем ПЕРВЫМ для EA, так как это специфичная категория)
  // Должны включать категории с "| GLOB | EA App" или "| EA App"
  // Также включаем конкретные игры: Battlefield™ 2042, Battlefield™ 6, EA SPORTS FC™ 24, EA SPORTS FC™ 26
  // Split Fiction, The Sims™ 4 (если они с | GLOB | EA App или без указания платформы)
  if (lowerName.includes('| glob | ea app') || lowerName.includes('| ea app') || 
      (lowerName.includes('ea app') && !lowerName.includes('ea gift card')) ||
      (lowerName.includes('battlefield') && (lowerName.includes('2042') || lowerName.includes('6')) && !lowerName.includes('xbox')) ||
      (lowerName.includes('ea sports fc') && (lowerName.includes('24') || lowerName.includes('26')) && !lowerName.includes('xbox')) ||
      (lowerName.includes('split fiction') && !lowerName.includes('xbox')) ||
      (lowerName.includes('the sims') && lowerName.includes('4') && !lowerName.includes('xbox'))) {
    return 'EA App';
  }
  
  // EA Gift Card (проверяем после EA App)
  // Только категории с явным указанием "EA Gift Card"
  if (lowerName.includes('ea gift card') || lowerName.includes('ea gift card |')) {
    return 'EA Gift Card';
  }
  
  // Amazon Gift Card
  if (lowerName.includes('amazon') || lowerName.startsWith('amazon.')) {
    return 'Amazon Gift Card';
  }
  
  // Apple Gift Card
  if (lowerName.includes('apple') && (lowerName.includes('gift card') || lowerName.includes('|'))) {
    return 'Apple Gift Card';
  }
  
  // Battle.net (включает Blizzard)
  if (lowerName.includes('battle.net') || lowerName.includes('battlenet') || 
      (lowerName.includes('blizzard') && lowerName.includes('gift card'))) {
    return 'Battle.net';
  }
  
  // Games | PC/Mac - только категории с "Games | PC/Mac" или "Minecraft"
  // НО не включаем Steam Games, Xbox Games, EA App, Mobile Games
  if ((lowerName.includes('games | pc/mac') || lowerName.includes('minecraft')) &&
      !lowerName.includes('steam') && !lowerName.includes('xbox') && 
      !lowerName.includes('ea') && !lowerName.includes('mobile')) {
    return 'Games | PC/Mac';
  }
  
  // Google Play Gift Card
  if (lowerName.includes('google play')) {
    return 'Google Play Gift Card';
  }
  
  // League of Legends
  if (lowerName.includes('league of legends')) {
    return 'League of Legends';
  }
  
  // Mobile Games Donation - категории с мобильными играми
  if (lowerName.includes('free fire') || lowerName.includes('mobile legends') || 
      lowerName.includes('pubg mobile') || lowerName.includes('delta force') || 
      lowerName.includes('doomsday') || lowerName.includes('honor of kings') || 
      lowerName.includes('lords mobile') || lowerName.includes('undawn') || 
      (lowerName.includes('mobile games') && lowerName.includes('donation'))) {
    return 'Mobile Games Donation';
  }
  
  // Music & Streaming (проверяем перед Social Network, так как Twitch здесь)
  if (lowerName.includes('netflix') || lowerName.includes('spotify') || lowerName.includes('twitch')) {
    return 'Music & Streaming';
  }
  
  // Nintendo Gift Card
  if (lowerName.includes('nintendo')) {
    return 'Nintendo Gift Card';
  }
  
  // Playstation Gift Card (включает PlayStation®Store Wallet)
  if (lowerName.includes('playstation') || lowerName.includes('playstation®')) {
    return 'Playstation Gift Card';
  }
  
  // Razer Gold Gift Card
  if (lowerName.includes('razer gold')) {
    return 'Razer Gold Gift Card';
  }
  
  // Riot Cash Card
  if (lowerName.includes('riot cash card') || lowerName.includes('riot cash')) {
    return 'Riot Cash Card';
  }
  
  // Roblox
  if (lowerName.includes('roblox')) {
    return 'Roblox';
  }
  
  // Rockstar Games
  if (lowerName.includes('rockstar') || lowerName.includes('grand theft auto') || 
      lowerName.includes('bully') || lowerName.includes('max payne')) {
    return 'Rockstar Games';
  }
  
  // Social Network (только Meta Quest, Twitch уже в Music & Streaming)
  if (lowerName.includes('meta quest')) {
    return 'Social Network';
  }
  
  // Valorant
  if (lowerName.includes('valorant')) {
    return 'Valorant';
  }
  
  return null;
};

export const groupCategories = (categories: GiftCategory[]) => {
  // Группируем API категории по основным категориям
  const grouped: Record<string, { name: string, categoryIds: number[] }> = {};

  categories.forEach(category => {
    // Игнорируем категории с некорректным ID (0 или меньше)
    if (category.category_id <= 0) {
      return;
    }

    // Пропускаем тестовые категории
    if (category.category_name.toLowerCase().includes('test')) {
      return;
    }

    const mainCategory = mapApiCategoryToMainCategory(category.category_name);
    
    if (mainCategory && MAIN_CATEGORIES.includes(mainCategory as any)) {
      if (!grouped[mainCategory]) {
        grouped[mainCategory] = {
          name: mainCategory,
          categoryIds: []
        };
      }
      grouped[mainCategory].categoryIds.push(category.category_id);
    }
  });

  // Создаем массив категорий с изображениями и подкатегориями
  return MAIN_CATEGORIES.map(categoryName => {
    const group = grouped[categoryName];
    
    // Проверяем, есть ли у категории подкатегории
    let subcategories: SubcategoryInfo[] | undefined;
    if (hasSubcategories(categoryName)) {
      const subcategoriesList = getSubcategories(categoryName);
      // Маппим подкатегории к API категориям
      subcategories = subcategoriesList.map(subcategory => {
        const categoryId = findApiCategoryByName(
          categories.map(cat => ({ category_id: cat.category_id, category_name: cat.category_name })),
          subcategory.name
        );
        return {
          name: subcategory.name,
          categoryId: categoryId || undefined
        };
      }).filter(sub => sub.categoryId !== undefined); // Фильтруем только те, которые найдены в API
    }
    
    return {
      id: group?.categoryIds[0] || 0, // Используем первый ID как основной
      name: categoryName,
      image: getCategoryImage(categoryName),
      count: group?.categoryIds.length || 0,
      tags: [], // Не используем больше tags
      tagIDs: [], // Не используем больше tagIDs
      categoryIds: group?.categoryIds || [], // Сохраняем все ID для загрузки товаров
      subcategories: subcategories // Добавляем подкатегории
    };
  }).filter(cat => cat.categoryIds.length > 0 || (cat.subcategories && cat.subcategories.length > 0)); // Показываем категории с товарами или с подкатегориями
};