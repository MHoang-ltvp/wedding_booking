import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';

// Route cha không path, chỉ element Layout; trang con render vào Outlet bên trong Layout.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}

export default App;
