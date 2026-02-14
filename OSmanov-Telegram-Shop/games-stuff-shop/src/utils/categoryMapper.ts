// utils/categoryMapper.ts

// Функция для нормализации названия игры в имя файла
const normalizeGameName = (gameName: string): string => {
  return gameName
    .toLowerCase()
    .replace(/[™®©]/g, '') // Убираем символы
    .replace(/[^\w\s]/g, '_') // Заменяем спецсимволы на подчеркивания
    .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
    .replace(/_+/g, '_') // Убираем множественные подчеркивания
    .replace(/^_|_$/g, ''); // Убираем подчеркивания в начале и конце
};

// Функция для поиска изображения конкретной игры
const getGameImage = (gameName: string, platform: string = ''): string | null => {
  const normalized = normalizeGameName(gameName);
  const lowerName = gameName.toLowerCase();
  const lowerPlatform = platform.toLowerCase();
  
  // Определяем платформу из названия категории
  const isSteam = lowerName.includes('steam games') || lowerPlatform.includes('steam games') || lowerPlatform.includes('steam');
  const isXbox = lowerName.includes('xbox games') || lowerPlatform.includes('xbox games');
  const isEAApp = lowerName.includes('ea app') || lowerPlatform.includes('ea app');
  const isMobile = lowerName.includes('mobile games') || lowerPlatform.includes('mobile games');
  const isRockstar = lowerName.includes('rockstar') || lowerPlatform.includes('rockstar');
  
  // Маппинг конкретных игр к их изображениям
  const gameImageMap: Record<string, { steam?: string; xbox?: string; ea?: string; mobile?: string; rockstar?: string }> = {
    // Xbox Games
    'apex_legends': { xbox: 'apex_xbox' },
    'destiny_2': { xbox: 'destiny_2_xbox_games', steam: 'destiny_2_steam_games' },
    'fallout_76': { xbox: 'fallout_76_xbox_games', steam: 'fallout_76_asia_steam_games' },
    'mafia_the_old_country': { xbox: 'mafia_the_old_country_xbox_games' },
    'minecraft': { xbox: 'minecraft_xbox_games' },
    'plants_vs_zombies_battle_for_neighborville': { xbox: 'plants_vs_zombies_battle_for_neighborville_xbox_games' },
    'the_elder_scrolls_iv_oblivion_remastered': { xbox: 'the_elder_scrolls_iv_oblivion_remastered_xbox_games', steam: 'the_elder_scrolls_iv_oblivion_remastered_asia_steam_games' },
    'tom_clancys_rainbow_six_extraction': { xbox: 'tom_clancys_rainbow_six_extraction_xbox_games' },
    'tom_clancys_rainbow_six_siege_x': { xbox: 'tom_clancys_rainbow_six_siege_x_xbox_games' },
    'tom_clancys_the_division_2': { xbox: 'tom_clancys_the_division_2_xbox_games' },
    'warhammer_40000_space_marine_2': { xbox: 'warhammer_40000_space_marine_2_xbox_games', steam: 'warhammer_40000_space_marine_2_gl_steam_games' },
    'halo_infinite': { xbox: 'halo_infinite_xbox_games' },
    'ea_sports_fc_25': { xbox: 'ea_sports_fc_25_xbox_games' },
    
    // EA App
    'battlefield_2042': { ea: 'battlefield_2042_ea_app' },
    'battlefield_6': { ea: 'battlefield_6_ea_app' },
    'ea_sports_fc_24': { ea: 'ea_sports_fc_24_ea_app' },
    'ea_sports_fc_26': { ea: 'ea_sports_fc_26_ea_app' },
    'split_fiction': { ea: 'split_fiction_ea_app' },
    'the_sims_4': { ea: 'the_sims_4_ea_app' },
    
    // Rockstar Games
    'bully_scholarship_edition': { rockstar: 'bully_scholarship_edition_rockstar' },
    'grand_theft_auto_v': { rockstar: 'grand_theft_auto_v_rockstar' },
    'max_payne_3': { rockstar: 'max_payne_3_rockstar' },
    
    // Mobile Games
    'delta_force_voucher': { mobile: 'delta_force_voucher_mobile_games' },
    'doomsday_last_survivors_gift_card': { mobile: 'doomsday_last_survivors_gift_card_mobile_games' },
    'honor_of_kings_gift_card': { mobile: 'honor_of_kings_gift_card_mobile_games' },
    'lords_mobile_gift_card': { mobile: 'lords_mobile_gift_card_mobile_games' },
    'undawn_gift_card': { mobile: 'undawn_gift_card_mobile_games' },
    'mobile_legends_bang_bang_voucher': { mobile: 'mobile_legends_bang_bang_voucher_mobile_games' },
    'freefire_gift_diamonds': { mobile: 'freefire_gift_diamonds' },
    'pubg_mobile_gift': { mobile: 'pubg_mobile_gift' },
    
    // Steam Games
    '7_days_to_die': { steam: '7_days_to_die_gl_steam_games' },
    'arc_raiders': { steam: 'arc_raiders_row_steam_games' },
    'atomic_heart': { steam: 'atomic_heart_row_steam_games' },
    'beyond_two_souls': { steam: 'beyond_two_souls_gl_steam_games' },
    'borderlands_4': { steam: 'borderlands_4_gl_steam_games' },
    'clair_obscur_expedition_33': { steam: 'clair_obscur_expedition_33_cis_steam_games' },
    'crusader_kings_iii': { steam: 'crusader_kings_iii_gl_steam_games' },
    'dark_souls_ii_scholar_of_the_first_sin': { steam: 'dark_souls_ii_scholar_of_the_first_sin_gl_steam_games' },
    'dead_cells': { steam: 'dead_cells_ru_steam_games' },
    'dead_island': { steam: 'dead_island_gl_steam_games' },
    'deathloop': { steam: 'deathloop_steam_games' },
    'dishonored_2': { steam: 'dishonored_2_steam_games' },
    'doom_eternal': { steam: 'doom_eternal__steam_games' },
    'doom_the_dark_ages': { steam: 'doom_the_dark_ages_steam_games' },
    'dying_light_2_stay_human': { steam: 'dying_light_2_stay_human_row_steam_games' },
    'dying_light': { steam: 'dying_light_gl_steam_games' },
    'elden_ring_nightreign': { steam: 'elden_ring_nightreign_ru_steam_games' },
    'euro_truck_simulator_2': { steam: 'euro_truck_simulator_2_gl_steam_games' },
    'fallout_3': { steam: 'fallout_3_asia_steam_games' },
    'fallout_4': { steam: 'fallout_4_asia_steam_games' },
    'fallout_new_vegas': { steam: 'fallout_new_vegas__cis_steam_games' },
    'farming_simulator_25': { steam: 'farming_simulator_25_cis_steam_games' },
    'final_fantasy_ix': { steam: 'final_fantasy_ix_gl_steam_games' },
    'final_fantasy_tactics_the_ivalice_chronicles': { steam: 'final_fantasy_tactics_the_ivalice_chronicles_gl_steam_games' },
    'final_fantasy_xx2_hd_remaster': { steam: 'final_fantasy_xx2_hd_remaster_gl_steam_games' },
    'for_the_king_ii': { steam: 'for_the_king_ii_cis_steam_games' },
    'ghostwire_tokyo': { steam: 'ghostwire_tokyo_asia_steam_games' },
    'ghost_of_tsushima_directors_cut': { steam: 'ghost_of_tsushima_directors_cut_cis_steam_games' },
    'helldivers_2': { steam: 'helldivers_2_cis_steam_games' },
    'hell_is_us': { steam: 'hell_is_us_row_steam_games' },
    'heretic_hexen': { steam: 'heretic_hexen_cis_steam_games' },
    'hollow_knight_silksong': { steam: 'hollow_knight_silksong_gl_steam_games' },
    'indiana_jones_and_the_great_circle': { steam: 'indiana_jones_and_the_great_circle_asia_steam_games' },
    'jump_space': { steam: 'jump_space_gl_steam_games' },
    'just_cause_2': { steam: 'just_cause_2_gl_steam_games' },
    'just_cause_4': { steam: 'just_cause_4_gl_steam_games' },
    'karma_the_dark_world': { steam: 'karma_the_dark_world_cis_steam_games' },
    'killing_floor_3': { steam: 'killing_floor_3_row_steam_games' },
    'kingdom_come_deliverance_ii': { steam: 'kingdom_come_deliverance_ii__cis_steam_games' },
    'laika_aged_through_blood': { steam: 'laika_aged_through_blood_ru_steam_games' },
    'lego_bricktales': { steam: 'lego_bricktales_ru_steam_games' },
    'life_is_strange_2': { steam: 'life_is_strange_2_gl_steam_games' },
    'life_is_strange': { steam: 'life_is_strange_row_steam_games' },
    'life_is_strange_true_colors': { steam: 'life_is_strange_true_colors_gl_steam_games' },
    'lost_in_random_the_eternal_die': { steam: 'lost_in_random_the_eternal_die_steam_games' },
    'metro_awakening': { steam: 'metro_awakening_gl_steam_games' },
    'metro_exodus': { steam: 'metro_exodus_gl_steam_games' },
    'midnight_murder_club': { steam: 'midnight_murder_club_cis_steam_games' },
    'mount_blade_ii_bannerlord': { steam: 'mount_blade_ii_bannerlord_gl_steam_games' },
    'old_school_runescape': { steam: 'old_school_runescape_gl_steam_games' },
    'outlast_2': { steam: 'outlast_2_gl_steam_games' },
    'pacman_world_repac': { steam: 'pacman_world_repac_gl_steam_games' },
    'planet_of_lana': { steam: 'planet_of_lana_ru_steam_games' },
    'prey': { steam: 'prey_asia_steam_games' },
    'pubg_battlegrounds': { steam: 'pubg_battlegrounds_gl_steam_games' },
    'ready_or_not': { steam: 'ready_or_not__cis_steam_games' },
    'rematch': { steam: 'rematch__row_steam_games' },
    'say_no_more': { steam: 'say_no_more_ru_steam_games' },
    'silent_hill_f': { steam: 'silent_hill_f_row_steam_games' },
    'sonic_racing_crossworlds': { steam: 'sonic_racing_crossworlds_gl_steam_games' },
    'squad': { steam: 'squad_gl_steam_games' },
    'starfield': { steam: 'starfield_asia_steam_games' },
    'steamworld_build': { steam: 'steamworld_build_ru_steam_games' },
    'steamworld_dig_2': { steam: 'steamworld_dig_2_ru_steam_games' },
    'steamworld_dig': { steam: 'steamworld_dig_ru_steam_games' },
    'steamworld_heist_ii': { steam: 'steamworld_heist_ii_ru_steam_games' },
    'steamworld_heist': { steam: 'steamworld_heist_ru_steam_games' },
    'steamworld_quest_hand_of_gilgamech': { steam: 'steamworld_quest_hand_of_gilgamech_ru_steam_games' },
    'stronghold_crusader_definitive_edition': { steam: 'stronghold_crusader_definitive_edition_gl_steam_games' },
    'tekken_7': { steam: 'tekken_7_cis_steam_games' },
    'tekken_8': { steam: 'tekken_8_row_steam_games' },
    'terraforming_mars': { steam: 'terraforming_mars_gl_steam_games' },
    'the_elder_scrolls_iii_morrowind_goty': { steam: 'the_elder_scrolls_iii_morrowind_goty_asia_steam_games' },
    'the_elder_scrolls_iv_oblivion_goty': { steam: 'the_elder_scrolls_iv_oblivion_goty_asia_steam_games' },
    'the_elder_scrolls_online': { steam: 'the_elder_scrolls_online_asia_steam_games' },
    'the_elder_scrolls_v_skyrim': { steam: 'the_elder_scrolls_v_skyrim_asia_steam_games' },
    'the_evil_within_2': { steam: 'the_evil_within_2_asia_steam_games' },
    'the_first_berserker_khazan': { steam: 'the_first_berserker_khazan_row_steam_games' },
    'the_forever_winter': { steam: 'the_forever_winter_cis_steam_games' },
    'the_gunk': { steam: 'the_gunk_ru_steam_games' },
    'the_last_of_us_part_ii_remastered': { steam: 'the_last_of_us_part_ii_remastered_cis_steam_games' },
    'the_last_of_us_part_i': { steam: 'the_last_of_us_part_i_row_steam_games' },
    'the_lord_of_the_rings_gollum': { steam: 'the_lord_of_the_rings_gollum_ru_steam_games' },
    'the_lord_of_the_rings_return_to_moria': { steam: 'the_lord_of_the_rings_return_to_moria_gl_steam_games' },
    'train_sim_world_6': { steam: 'train_sim_world_6_gl_steam_games' },
    'tt_isle_of_man_ride_on_the_edge_2': { steam: 'tt_isle_of_man_ride_on_the_edge_2_gl_steam_games' },
    'vampire_the_masquerade_swansong': { steam: 'vampire_the_masquerade_swansong_gl_steam_games' },
    'viewfinder': { steam: 'viewfinder_ru_steam_games' },
    'voidbreaker': { steam: 'voidbreaker_ae_steam_games' },
    'v_rising': { steam: 'v_rising_row_steam_games' },
    'warhammer_40000_dawn_of_war_definitive_edition': { steam: 'warhammer_40000_dawn_of_war_definitive_edition_gl_steam_games' },
    'warhammer_40000_rogue_trader': { steam: 'warhammer_40000_rogue_trader_cis_steam_games' },
    'wavetale': { steam: 'wavetale_ru_steam_games' },
    'white_shadows': { steam: 'white_shadows_ru_steam_games' },
    'wolfenstein_ii_the_new_colossus': { steam: 'wolfenstein_ii_the_new_colossus_asia_steam_games' },
    'wolfenstein_the_new_order': { steam: 'wolfenstein_the_new_order_asia_steam_games' },
    'wolfenstein_the_old_blood': { steam: 'wolfenstein_the_old_blood_asia_steam_games' },
  };
  
  // Ищем точное совпадение
  const gameEntry = gameImageMap[normalized];
  if (gameEntry) {
    // Возвращаем изображение в зависимости от платформы
    if (isXbox && gameEntry.xbox) return gameEntry.xbox;
    if (isSteam && gameEntry.steam) return gameEntry.steam;
    if (isEAApp && gameEntry.ea) return gameEntry.ea;
    if (isMobile && gameEntry.mobile) return gameEntry.mobile;
    if (isRockstar && gameEntry.rockstar) return gameEntry.rockstar;
    // Если платформа не определена, возвращаем первую доступную
    return gameEntry.xbox || gameEntry.steam || gameEntry.ea || gameEntry.mobile || gameEntry.rockstar || null;
  }
  
  // Ищем частичное совпадение
  for (const [key, value] of Object.entries(gameImageMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      if (isXbox && value.xbox) return value.xbox;
      if (isSteam && value.steam) return value.steam;
      if (isEAApp && value.ea) return value.ea;
      if (isMobile && value.mobile) return value.mobile;
      if (isRockstar && value.rockstar) return value.rockstar;
      return value.xbox || value.steam || value.ea || value.mobile || value.rockstar || null;
    }
  }
  
  return null;
};

// Функция для поиска изображения категории
export const getCategoryImage = (categoryName: string, fullCategoryName?: string): string => {
  // Сначала проверяем точное совпадение
  if (categoryImageMap[categoryName]) {
    return categoryImageMap[categoryName];
  }
  
  // Пытаемся найти изображение для конкретной игры
  const fullName = fullCategoryName || categoryName;
  const gameImage = getGameImage(fullName, fullName);
  if (gameImage) {
    return gameImage;
  }
  
  // Нормализуем название для поиска (убираем регистр и лишние пробелы)
  const normalizedName = categoryName.trim();
  
  // Проверяем различные варианты названий
  const lowerName = normalizedName.toLowerCase();
  
  // Steam
  if (lowerName.includes('steam')) return 'steam';
  
  // Valorant и Riot
  if (lowerName.includes('valorant')) return 'valorant';
  if (lowerName.includes('riot cash card') || lowerName.includes('riot cash')) return 'riot_cash_card';
  if (lowerName.includes('league of legends')) return 'league_of_legends';
  
  // Apple
  if (lowerName.includes('apple')) return 'Apple';
  
  // Nintendo
  if (lowerName.includes('nintendo')) return 'nintendo_gift';
  
  // Xbox
  if (lowerName.includes('xbox game pass')) return 'xbox_gamepass';
  if (lowerName.includes('xbox games') || lowerName.includes('xbox games/add-ons')) return 'xbox_games';
  if (lowerName.includes('xbox')) return 'xbox_gift';
  
  // Roblox
  if (lowerName.includes('roblox')) return 'roblox_global';
  
  // PlayStation
  if (lowerName.includes('playstation') || lowerName.includes('playstation®')) return 'playstation_gift';
  
  // Blizzard и Battle.net
  if (lowerName.includes('battle.net') || lowerName.includes('battlenet')) return 'battlenet';
  if (lowerName.includes('blizzard')) return 'blizzard_gift';
  
  // Google Play
  if (lowerName.includes('google play')) return 'google_play_gift';
  
  // EA
  if (lowerName.includes('ea app')) return 'ea_app';
  if (lowerName.includes('ea sports') || lowerName.includes('ea gift') || lowerName.includes('ea ')) return 'ea_gift';
  if (lowerName.includes('battlefield') || lowerName.includes('plants vs. zombies') || lowerName.includes('the sims') || lowerName.includes('split fiction')) return 'ea_gift';
  
  // Мобильные игры
  if (lowerName.includes('free fire') || lowerName.includes('mobile legends') || lowerName.includes('pubg mobile') || 
      lowerName.includes('delta force') || lowerName.includes('doomsday') || lowerName.includes('honor of kings') || 
      lowerName.includes('lords mobile') || lowerName.includes('undawn')) return 'mobile_games_don';
  
  // Razer Gold
  if (lowerName.includes('razer gold')) return 'razer_gold_gift_card';
  
  // Amazon
  if (lowerName.includes('amazon')) return 'amazon_gift_card';
  
  // Стриминг и музыка
  if (lowerName.includes('music & streaming') || lowerName.includes('netflix') || lowerName.includes('spotify')) return 'music_streaming';
  
  // Социальные сети
  if (lowerName.includes('social network') || lowerName.includes('twitch') || lowerName.includes('meta quest')) return 'social_network';
  
  // Rockstar Games
  if (lowerName.includes('rockstar') || lowerName.includes('grand theft auto') || lowerName.includes('bully') || lowerName.includes('max payne')) return 'rockstar_games';
  
  // Steam Wallet (отдельно от Steam Games)
  if (lowerName.includes('steam wallet')) return 'steam';
  
  // Steam Games (отдельно от Steam Wallet)
  if (lowerName.includes('steam games')) return 'steam';
  
  // Xbox Subscriptions
  if (lowerName.includes('xbox subscriptions') || lowerName.includes('xbox game pass')) return 'xbox_gamepass';
  
  // Mobile Games Donation
  if (lowerName.includes('mobile games donation') || lowerName.includes('mobile games')) return 'mobile_games_don';
  
  // Игры (проверяем только если это не специфичная категория)
  // Проверяем "Games | PC/Mac" или просто "Games" в начале названия
  if (lowerName.includes('games | pc/mac') || (lowerName.startsWith('games') && !lowerName.includes('steam') && !lowerName.includes('xbox'))) return 'games_pc_mac';
  
  // Fallback - используем games_pc_mac для всех остальных
  return 'games_pc_mac';
};

export const categoryImageMap: Record<string, string> = {
  // Основные платформы
  'Steam': 'steam',
  'Steam Wallet Code': 'steam',
  'Steam Wallet': 'steam',
  'Steam Games': 'steam',
  
  // Valorant и Riot
  'Valorant': 'valorant',
  'Riot Cash Card': 'riot_cash_card',
  'League of Legends': 'league_of_legends',
  
  // Apple
  'Apple': 'Apple',
  'Apple Gift Card': 'Apple',
  
  // Nintendo
  'Nintendo': 'nintendo_gift',
  'Nintendo Gift Card': 'nintendo_gift',
  
  // Xbox
  'Xbox': 'xbox_gift',
  'Xbox Gift Card': 'xbox_gift',
  'Xbox Game Pass': 'xbox_gamepass',
  'Xbox Subscriptions': 'xbox_gamepass',
  'Xbox Games': 'xbox_games',
  'Xbox Games/add-ons': 'xbox_games',
  'Apex Legends': 'xbox_games',
  'Halo': 'xbox_games',
  
  // Roblox
  'Roblox': 'roblox_global',
  'Roblox Gift Card': 'roblox_global',
  
  // PlayStation
  'Playstation': 'playstation_gift',
  'PlayStation': 'playstation_gift',
  'Playstation Gift Card': 'playstation_gift',
  'PlayStation®Store Wallet': 'playstation_gift',
  
  // Blizzard и Battle.net
  'Blizzard': 'blizzard_gift',
  'Blizzard Gift Card': 'blizzard_gift',
  'Battle.net': 'battlenet',
  'Battle.net Gift Card': 'battlenet',
  
  // Google Play
  'Google Play': 'google_play_gift',
  'Google Play Gift Card': 'google_play_gift',
  'Google Play Gift Code': 'google_play_gift',
  
  // EA
  'EA': 'ea_gift',
  'EA Gift Card': 'ea_gift',
  'EA App': 'ea_app',
  'EA SPORTS FC': 'ea_gift',
  'Battlefield': 'ea_gift',
  'Plants vs. Zombies': 'ea_gift',
  'The Sims': 'ea_gift',
  'Split Fiction': 'ea_gift',
  
  // Мобильные игры
  'Free Fire': 'mobile_games_don',
  'Mobile Legends': 'mobile_games_don',
  'Mobile Legends: Bang Bang': 'mobile_games_don',
  'Mobile Games Donation': 'mobile_games_don',
  'Pubg Mobile': 'mobile_games_don',
  'Pubg Mobile Gift Card': 'mobile_games_don',
  'Delta Force': 'mobile_games_don',
  'Doomsday: Last Survivors': 'mobile_games_don',
  'Honor of Kings': 'mobile_games_don',
  'Lords Mobile': 'mobile_games_don',
  'Undawn': 'mobile_games_don',
  
  // Razer Gold
  'Razer Gold': 'razer_gold_gift_card',
  'Razer Gold Gift Card': 'razer_gold_gift_card',
  
  // Amazon
  'Amazon Gift Card': 'amazon_gift_card',
  'amazon': 'amazon_gift_card',
  'amazon.ae': 'amazon_gift_card',
  'amazon.au': 'amazon_gift_card',
  'amazon.com': 'amazon_gift_card',
  'amazon.de': 'amazon_gift_card',
  'amazon.fr': 'amazon_gift_card',
  'amazon.in': 'amazon_gift_card',
  'amazon.it': 'amazon_gift_card',
  'Amazon.jp': 'amazon_gift_card',
  'amazon.nl': 'amazon_gift_card',
  'amazon.sa': 'amazon_gift_card',
  'amazon.tr': 'amazon_gift_card',
  'amazon.uk': 'amazon_gift_card',
  
  // Стриминг и музыка
  'Music & Streaming': 'music_streaming',
  'Netflix': 'music_streaming',
  'Netflix Gift Card': 'music_streaming',
  'Spotify': 'music_streaming',
  'Spotify Premium': 'music_streaming',
  'Spotify Gift Card': 'music_streaming',
  
  // Социальные сети
  'Social Network': 'social_network',
  'Twitch': 'social_network',
  'Twitch Gift Card': 'social_network',
  
  // Rockstar Games
  'Rockstar': 'rockstar_games',
  'Rockstar Games': 'rockstar_games',
  'Grand Theft Auto': 'rockstar_games',
  'Bully': 'rockstar_games',
  'Max Payne': 'rockstar_games',
  
  // Meta Quest
  'Meta Quest': 'games_pc_mac',
  'Meta Quest gift card': 'games_pc_mac',
  
  // Игры (общие)
  'Games': 'games_pc_mac',
  'Games | PC/Mac': 'games_pc_mac',
  
  // Различные игры (используем games_pc_mac как fallback)
  'Destiny': 'games_pc_mac',
  'Mafia': 'games_pc_mac',
  'Minecraft': 'games_pc_mac',
  'The Elder Scrolls': 'games_pc_mac',
  'Tom Clancy': 'games_pc_mac',
  'Warhammer': 'games_pc_mac',
  'DOOM': 'games_pc_mac',
  'Indiana Jones': 'games_pc_mac',
  'Killing Floor': 'games_pc_mac',
  'Kingdom Come': 'games_pc_mac',
  'Lost in Random': 'games_pc_mac',
  'Ready or Not': 'games_pc_mac',
  'REMATCH': 'games_pc_mac',
  'Test': 'games_pc_mac',
  
  // Все остальные категории будут использовать games_pc_mac как fallback
};
