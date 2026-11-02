import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext.jsx';
import { ThemeContext } from './ThemeContext.jsx';
import Cart from './Cart.jsx';
import Products from './Products.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import Menu from './Menu.jsx';
import ProductDetail from './ProductDetail.jsx';
import './App.css';
import UserPanel from './UserPanel.jsx';

export default function App() {
  const [theme, setTheme] = useState(window.localStorage.getItem("theme") ?? "light")
  const [user, setUser] = useState(() => {
  const savedUser = window.localStorage.getItem("user");
  if (!savedUser || savedUser === "null") return null;
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  });

  const toggleTheme = () => {
    var newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    window.localStorage.setItem("theme", newTheme)
    console.log("theme changed")
  }

  const logout = () => {
    setUser(null)
    window.localStorage.setItem("user", null)
  }

  const appStyles = {
    backgroundColor: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    minHeight: "100vh",
    padding: "20px"
  }

  useEffect(() => {
    console.log(user)
    }, []);

  return (
    <UserContext.Provider value={{user, logout, setUser}}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <div style={appStyles}>
            <BrowserRouter>
              <div style={{alignContent:"center"}}>
              <Menu />
              </div>
              <Routes>
                <Route path="/" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/userpanel" element={<UserPanel />} />
              </Routes>
            </BrowserRouter>
          </div>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}
