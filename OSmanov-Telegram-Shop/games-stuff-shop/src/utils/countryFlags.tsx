// utils/countryFlags.tsx
import React from 'react';
import Flag from 'react-world-flags';

interface FlagComponentProps {
  countryCode: string;
  size?: number;
  className?: string;
}

export const getCountryFlag = (countryCode: string): React.ReactElement => {
  const countryMap: Record<string, string> = {
    'USA': 'US', 'US': 'US',
    'RU': 'RU', 'TR': 'TR', 'EU': 'EU', 'UK': 'GB',
    'PL': 'PL', 'DE': 'DE', 'FR': 'FR', 'IT': 'IT',
    'ES': 'ES', 'BR': 'BR', 'JP': 'JP', 'IN': 'IN',
    'CA': 'CA', 'AU': 'AU', 'CN': 'CN', 'KR': 'KR',
    'MX': 'MX', 'AE': 'AE', 'SA': 'SA', 'QA': 'QA',
    'KW': 'KW', 'HK': 'HK', 'SG': 'SG', 'MY': 'MY',
    'ID': 'ID', 'TH': 'TH', 'VN': 'VN', 'PH': 'PH',
    'GLOB': 'UN', // Глобальный - флаг ООН
    'CIS': 'RU', // СНГ - российский флаг как основной
    'LATAM': 'MX', // Латинская Америка - мексиканский флаг
    'PT': 'PT', 'IE': 'IE', 'BE': 'BE',
    'TRY': 'TR',
    'ZAR': 'ZA',
    'ZA': 'ZA',
    'HU': 'EG',
    'CO': 'CO',
    'PLN': 'PL',
    'INR': 'IN',
    'AT': 'AT',
    'BH': 'BH',
    'CZ': 'CZ',
    'FI': 'FI',
    'GR': 'GR',
    'HR': 'HR',
    'LB': 'LB',
    'LU': 'LU',
    'NL': 'NL',
    'NZ': 'NZ',
    'OM': 'OM',
    'RO': 'RO',
    'SK': 'SK',
    'DZ': 'DZ',
    'ROW': 'RO'
  };

  const code = countryMap[countryCode] || 'UN';
  
  return (
    <Flag 
      code={code} 
      width={24} 
      height={18}
      style={{ borderRadius: '2px' }}
    />
  );
};

// Альтернативная версия с кастомными размерами
export const CountryFlag: React.FC<FlagComponentProps> = ({ 
  countryCode, 
  size = 24,
  className = ""
}) => {
  const countryMap: Record<string, string> = {
    'USA': 'US', 'US': 'US',
    'RU': 'RU', 'TR': 'TR', 'EU': 'EU', 'UK': 'GB',
    'PL': 'PL', 'DE': 'DE', 'FR': 'FR', 'IT': 'IT',
    'ES': 'ES', 'BR': 'BR', 'JP': 'JP', 'IN': 'IN',
    'CA': 'CA', 'AU': 'AU', 'CN': 'CN', 'KR': 'KR',
    'MX': 'MX', 'AE': 'AE', 'SA': 'SA', 'QA': 'QA',
    'KW': 'KW', 'HK': 'HK', 'SG': 'SG', 'MY': 'MY',
    'ID': 'ID', 'TH': 'TH', 'VN': 'VN', 'PH': 'PH',
    'GLOB': 'UN',
    'CIS': 'RU',
    'LATAM': 'MX',
    'PT': 'PT', 'IE': 'IE', 'BE': 'BE',
    'USD': 'USA',
    'TRY': 'TR',
    'ZAR': 'ZA',
    'ZA': 'ZA',
    'HU': 'EG',
    'CO': 'CO',
    'PLN': 'PL',
    'INR': 'IN',
    'AT': 'AT',
    'BH': 'BH',
    'CZ': 'CZ',
    'FI': 'FI',
    'GR': 'GR',
    'HR': 'HR',
    'LB': 'LB',
    'LU': 'LU',
    'NL': 'NL',
    'NZ': 'NZ',
    'OM': 'OM',
    'RO': 'RO',
    'SK': 'SK',
    'DZ': 'DZ',
    'ROW': 'RO'
  };

  const code = countryMap[countryCode] || 'UN';
  
  return (
    <Flag 
      code={code} 
      width={size}
      height={size * 0.75}
      className={className}
      style={{ 
        borderRadius: '3px',
        objectFit: 'cover'
      }}
    />
  );
};