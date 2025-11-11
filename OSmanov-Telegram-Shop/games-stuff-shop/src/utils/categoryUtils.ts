// utils/categoryUtils.ts
import type { GiftCategory } from '../types/api.types';
import { categoryImageMap } from './categoryMapper';

export const groupCategories = (categories: GiftCategory[]) => {
  const grouped: Record<string, { id: number, name: string, count: number, tags: string[], tagIDs: number[] }> = {};

  categories.forEach(category => {
    // Извлекаем основное название категории (убираем регионы и доп. информацию)
    let mainCategory = category.category_name.split('|')[0].trim();
    mainCategory = mainCategory.split('|')[0].trim(); // На случай двойных |
    mainCategory = mainCategory.split('/')[0].trim(); // На случай слешей

    let addCategory = category.category_name.split('|')[1];
    if (addCategory) {
      addCategory = addCategory.trim();
    }
    
    let addCategoryID = category.category_id;
    if (addCategory) {
      addCategory = addCategory.trim();
    }
    
    // Обработка специальных случаев
    if (mainCategory.includes('Steam')) mainCategory = 'Steam';
    else if (mainCategory.includes('Xbox')) mainCategory = 'Xbox';
    else if (mainCategory.includes('PlayStation') || mainCategory.includes('Playstation')) mainCategory = 'Playstation';
    else if (mainCategory.includes('Google Play')) mainCategory = 'Google Play';
    else if (mainCategory.includes('Apple')) mainCategory = 'Apple';
    else if (mainCategory.includes('Valorant')) mainCategory = 'Valorant';
    else if (mainCategory.includes('Roblox')) mainCategory = 'Roblox';
    else if (mainCategory.includes('Blizzard')) mainCategory = 'Blizzard';
    else if (mainCategory.includes('Nintendo')) mainCategory = 'Nintendo';
    else if (mainCategory.includes('Netflix')) mainCategory = 'Netflix';
    else if (mainCategory.includes('Spotify')) mainCategory = 'Spotify';
    else if (mainCategory.includes('EA')) mainCategory = 'EA';
    else if (mainCategory.includes('Meta Quest')) mainCategory = 'Meta Quest';
    else if (mainCategory.includes('Twitch')) mainCategory = 'Twitch';

    if (!grouped[mainCategory]) {
      grouped[mainCategory] = {
        id: category.category_id,
        name: mainCategory,
        count: 0,
        tags: [],
        tagIDs: []
      };
    }
    grouped[mainCategory].count++;
    if (addCategory) {
      grouped[mainCategory].tags.push(addCategory);
      grouped[mainCategory].tagIDs.push(addCategoryID);
    }
  });

  // Преобразуем в массив и добавляем картинки
  return Object.values(grouped).map(group => ({
    ...group,
    image: categoryImageMap[group.name] || 'games_pc_mac' // fallback image
  }));
};