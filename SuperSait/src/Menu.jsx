import { useContext, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { UserContext } from "./UserContext";

export default function Menu() {
    /*
    Меню. Здесь отображаются все страницы в приложении и текущий пользователь
  */
    const navigate = useNavigate();
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { user, logout} = useContext(UserContext)

    const linkStyle = ({ isActive }) => ({
        color: isActive ? "red" : theme === "dark" ? "#ffffff" : "#333",
        fontWeight: isActive ? "bold" : "normal",
        margin: "10px",
        textDecoration: "none"
    });
      useEffect(() => {
        console.log("loading menu, user:")
        console.log(user)
    }, []);
    return (
        <nav style={{ margin: "10px", display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
            <div style={{ margin: "10px", display:"flex", flexDirection:"row"}}>
            <NavLink to="/" style={linkStyle}>Главная</NavLink>
            {user == null ? <div/> : user.roleid == 2 ? <NavLink to="/cart" style={linkStyle}>Корзина</NavLink> : <div/>}
            {user == null ? <div/> : <NavLink to="/dashboard" style={linkStyle}>Дешборд</NavLink>}
            {user == null ? <div/> : user.roleid == 1 ? <NavLink to="/userpanel" style={linkStyle}>Управление пользователями</NavLink> : <div/>}
            </div>
            <div style={{ margin: "10px", display:"flex", flexDirection:"row"}}>
            {user == null ? <NavLink to="/login" style={linkStyle}>Войти/Зарегестрироваться</NavLink> : <button onClick={() => {logout(); navigate("/")}} style={{ margin: "10px", height:"28px", alignSelf:"anchor-center"}}>Выйти</button>}
            {user == null ? <div/> : <p style={{alignSelf:"anchor-center", margin:"10px"}}>{user.email}</p>}
            <button onClick={toggleTheme} style={{ marginLeft: "20px", height:"28px", alignSelf:"anchor-center"}}>
                Переключить тему ({theme})
            </button>
            </div>
        </nav>
    );
}
