import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import MiniAiChat from '../../chat/MiniAiChat/MiniAiChat';
import './MainLayout.css';

const IMMERSIVE_ROUTES = new Set(['/ai-assistant']);

const MainLayout = () => {
  const { pathname } = useLocation();
  const isImmersive = IMMERSIVE_ROUTES.has(pathname);

  useEffect(() => {
    const main = document.querySelector('.main-layout-main-area');
    if (main) {
      main.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="main-layout-container">
      <div className="main-layout-content-wrapper">
        <Header />
        <main
          className={`main-layout-main-area${isImmersive ? ' main-layout-main-area--immersive' : ''}`}
        >
          <div
            className={`main-layout-page-wrapper${isImmersive ? ' main-layout-page-wrapper--immersive' : ''}`}
          >
            <Outlet />
          </div>
          {!isImmersive && <Footer />}
        </main>
        <MiniAiChat />
      </div>
    </div>
  );
};

export default MainLayout;
