import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();

    // 自动导航到一键创作页面
    useEffect(() => {
        navigate('/app/aiacotor-entry', { replace: true });
    }, [navigate]);

    // 由于自动导航到一键创作页面，此处不需要渲染任何内容
    return null;
};

export default WelcomePage;
