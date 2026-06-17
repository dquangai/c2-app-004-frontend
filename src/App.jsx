import { RouterProvider } from 'react-router-dom';
import router from './router';
import { AuthProvider } from './context/AuthContext/AuthContext';
import { LanguageProvider } from './context/LanguageContext/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
