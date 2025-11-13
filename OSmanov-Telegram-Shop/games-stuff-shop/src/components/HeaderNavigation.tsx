import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useUser } from '../context/UserContext';
import { useCurrency } from '../hooks/useCurrency';

// Icons
import Logo from "../assets/icons/Logo.svg";
import BalanceIndicatorIcon from "../assets/icons/rub-icon.svg";
import WalletIcon from "../assets/icons/wallet-icon.svg";
import ProfileIcon from "../assets/icons/menu-profile-icon.svg"
import { useEffect, useState } from "react";

const HeaderNavigation: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useUser();
    const { convertToRub, usdToRubRate, loading: ratesLoading } = useCurrency();
    const [convertedBalance, setConvertedBalance] = useState<number | undefined>();

    useEffect(() => {
        const convertBalance = async () => {
            if (user) {
                const rubAmount = await convertToRub(user.balance, 'USD');
                setConvertedBalance(rubAmount);
            }
        };

        convertBalance();
    }, [user?.balance, convertToRub, ratesLoading, usdToRubRate]);

    const handleTopUpClick = () => {
        navigate('/profile?topup=true');
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    // Форматируем баланс для отображения
    const formatBalance = (balance: number | undefined) => {
        if (balance) {
            return balance.toFixed(1);
        } else {
            return "";
        }
    };

    return (
        <NavLine>
            <StyledLogo src={Logo} />
            <BalanceIndicator>
                <img src={BalanceIndicatorIcon} alt="BalanceIndicator" />
                <span>
                    {loading ? 'Загрузка...' : user ? formatBalance(convertedBalance) : '0'}
                </span>
            </BalanceIndicator>
            <TopUpButton onClick={handleTopUpClick}>
                <img src={WalletIcon} alt="WalletIcon" />
            </TopUpButton>
            <ProfileButton onClick={handleProfileClick}>
                <img src={ProfileIcon} alt="ProfileIcon" />
            </ProfileButton>
        </NavLine>
    )
}

export default HeaderNavigation;

// Styles (остаются без изменений)
const StyledLogo = styled.img`
    height: 100%;
    user-select: none;
    -webkit-user-drag: none;
`;

const NavLine = styled.div`
    display: flex;
    flex-direction: row;

    box-sizing; border-box;
    padding: 12px 16px;

    border: 1px solid rgba(255, 255, 255, 10%);
    max-width: var(--max-window-width);

    position: fixed;
    width: calc(100% - 24px);

    border-radius: 14px;

    align-items: center;
    gap: 5px;

    min-height: 70px;
    max-height: 80px;
    height: 100%;
    box-sizing: border-box;

    min-width: 320px;

    background: rgba(21, 25, 50, 0.8);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);

    z-index: 999;
`

const BalanceIndicator = styled.div`
    display: flex;
    flex-direction: row;

    border-radius: 7px;
    border: 0.5px solid #707070;

    align-items: center;
    justify-content: space-around;
    max-width: 180px;
    min-width: auto;
    box-sizing: border-box;
    padding: 5px;

    margin-left: auto;
    margin-right: 0;
    gap: 10px;

    height: 85%;

    & img {
        max-width: 28px;
        min-width: 28px;
        aspect-ration: 1;
    }

    & span {
        color: #fff;
        font-family: "Jura-Regular";
        font-size: 20px;
    }
`;

const TopUpButton = styled.button`
    border-radius: 7px;
    padding: 10px;
    aspect-ratio: 1;

    background: linear-gradient(to right, #88FB47, #27C151);
    border: none;

    height: 85%;
    display: flex;
    align-items: center;
    justify-content: center;

    & img {
        width: 24px;
        height: auto;
    }

    &:hover {
        cursor: pointer;
    }
`;

const ProfileButton = styled.button`
    border-radius: 7px;
    padding: 10px;
    aspect-ratio: 1;

    background: none;
    border: 0.5px solid #707070;

    height: 85%;
    display: flex;
    align-items: center;
    justify-content: center;

    & img {
        width: 24px;
        height: auto;
    }

    &:hover {
        cursor: pointer;
    }
`;