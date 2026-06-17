import './App.css';
import { Route } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { AuthCallBackPage } from './pages/AuthCallBackPage';
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<h1>Home</h1>}></Route>
        <Route path="/auth-callback" element={<AuthCallBackPage />}></Route>
      </Routes>
    </>
  );
}

export default App;
