import './App.css';
import { Route } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { AuthCallBackPage } from './pages/AuthCallBackPage';
import { HomePage } from './pages/HomePage';
import {axiosInstance} from './lib/axios'
function App() {
  




  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/auth-callback" element={<AuthCallBackPage />}></Route>
      </Routes>
    </>
  );
}

export default App;
