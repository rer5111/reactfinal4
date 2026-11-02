import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import { attemptLogin, createUser, getUserByEmail, getUserById, tryChangePass, updateUser } from "./api/users";

export default function Login() {
  /*
    Страница логина. При навигации в эту страницу с указанным адрессом перенаправления, логин вернет пользователя на страницу
    указаную в навигации после авторизации.
  */
  const location = useLocation();
  const { redirect } = location.state || {};
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  
  const [message, setMessage] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); 
  const [code, setCode] = useState(0);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPasswordRepeat, setRegPasswordRepeat] = useState("");
  
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPasswordAfterReset, setNewPasswordAfterReset] = useState("");

  const resetInterfaceModes = (mode) => {
    setMessage("");
    setLoginEmail("");
    setLoginPassword("");
    setRegFullName("");
    setRegPhone("");
    setRegPasswordRepeat("");
    setRecoveryEmail("");
    setVerificationCode("");
    setNewPasswordAfterReset("");
    setRecoveryStep(1);

    if (mode === "forgot") {
      setForgotPasswordMode(true);
      setRegisterMode(false);
    } else if (mode === "register") {
      setForgotPasswordMode(false);
      setRegisterMode(true);
    } else {
      setForgotPasswordMode(false);
      setRegisterMode(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (forgotPasswordMode) {
        if (recoveryStep === 1) {
          const emailTrimmed = recoveryEmail.trim();
          if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
            setMessage("Введите корректный email адрес!");
            return;
          }
          const response = await getUserByEmail(emailTrimmed);
          setLoginEmail(emailTrimmed);
          const generatedCode = Math.floor(Math.random() * (999999 - 99999) + 99999)
          console.log(generatedCode)
          setCode(generatedCode);
          setMessage("Код восстановления был \"Отправлен\" вам на почту (его можно найти в консоли)");
          setRecoveryStep(2);
          return;
        }

        if (recoveryStep === 2) {
          if (!verificationCode.trim() || !newPasswordAfterReset.trim()) {
            setMessage("Заполните проверочный код и новый пароль!");
            return;
          }
          console.log(verificationCode.trim(), code)
          if (parseInt(verificationCode.trim()) == code){
          setMessage("Пароль успешно изменен! Вы можете войти в аккаунт.");
          const response = await tryChangePass(loginEmail, newPasswordAfterReset.trim())
          resetInterfaceModes("login");
          return;
          }
          else{
            setMessage("Неверный код.")
            return;
          }
        }
      }

      if (!registerMode) {
        if (!loginEmail.trim() || !loginPassword.trim()) {
          setMessage("Пожалуйста, заполните логин и пароль!");
          return;
        }

        const response = await attemptLogin(loginEmail.trim(), loginPassword.trim());
        
        if (response && "message" in response) {
          setMessage(response.message);
        } else if (response) {
          if (response.pass) delete response.pass;
          setUser(response);
          localStorage.setItem("user", JSON.stringify(response));
          navigate(redirect ?? "/dashboard", { replace: true });
        }
      } 
      else {
        const emailInput = loginEmail.trim();
        const fullNameInput = regFullName.trim();
        const phoneInput = regPhone.trim();

        if (!fullNameInput || !emailInput || !loginPassword.trim() || !regPasswordRepeat.trim() || !phoneInput) {
          setMessage("Все поля регистрационной формы обязательны!");
          return;
        }

        if (loginPassword.length < 8) {
          setMessage("Пароль должен состоять из 8 или более символов!");
          return;
        }
        if (loginPassword.toUpperCase() === loginPassword || loginPassword.toLowerCase() === loginPassword) {
          setMessage("Пароль должен содержать прописные и строчные буквы!");
          return;
        }
        if (!(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].some(str => loginPassword.includes(str)))) {
          setMessage("Пароль должен содержать хотя бы одну цифру!");
          return;
        }
        if (!(emailInput.includes('@') && emailInput.includes('.'))) {
          setMessage("Логин должен быть корректным Email адресом!");
          return;
        }
        if (loginPassword !== regPasswordRepeat) {
          setMessage("Введенные пароли не совпадают!");
          return;
        }

        const response = await createUser({
          fullName: fullNameInput,
          email: emailInput,
          pass: loginPassword,
          phone: phoneInput,
          roleID: 2
        });

        if (response && "error" in response) {
          setMessage(`Неудачная попытка регистрации: ${response.error}`);
        } else if (response && "message" in response) {
          setMessage(response.message);
        } else {
          resetInterfaceModes("login");
          setMessage("Регистрация завершена. Теперь выполните вход.");
        }
      }
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setMessage("На данный момент сервер недоступен. Попробуйте позже.");
      } else {
        setMessage(`Ошибка: ${err.message}`);
      }
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "450px", margin: "0 auto", textAlign: "center" }}>
      {forgotPasswordMode ? (
        <h2>Восстановление пароля</h2>
      ) : registerMode ? (
        <h2>Регистрация нового аккаунта</h2>
      ) : (
        <h2>Авторизация</h2>
      )}
      
      <div style={{ color: "red", minHeight: "24px", marginBottom: "15px", fontWeight: "bold" }}>
        {message}
      </div>
      
      <form onSubmit={handleLogin}>
        {forgotPasswordMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginTop: "15px" }}>
            {recoveryStep === 1 ? (
              <input 
                key="recovery-email"
                type="email" 
                placeholder="Email" 
                value={recoveryEmail} 
                onChange={(e) => { setMessage(""); setRecoveryEmail(e.target.value); }}
                style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
              />
            ) : (
              <>
                <input 
                  key="recovery-code"
                  type="text" 
                  placeholder="Код проверки" 
                  value={verificationCode} 
                  onChange={(e) => { setMessage(""); setVerificationCode(e.target.value); }}
                  style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
                />
                <input 
                  key="recovery-password"
                  type="password" 
                  placeholder="Новый пароль" 
                  value={newPasswordAfterReset} 
                  onChange={(e) => { setMessage(""); setNewPasswordAfterReset(e.target.value); }}
                  style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
                />
              </>
            )}
            <button type="submit" style={{ padding: "10px 20px", width: "100%", marginTop: "10px", cursor: "pointer" }}>
              {recoveryStep === 1 ? "Сгенерировать код" : "Сохранить новый пароль"}
            </button>
            <button 
              type="button" 
              onClick={() => resetInterfaceModes("login")}
              style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer", marginTop: "10px" }}
            >
              Назад к авторизации
            </button>
          </div>
        ) : registerMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginTop: "15px" }}>
            <input key="reg-fullname" type='text' value={regFullName} placeholder="ФИО" onChange={(e) => { setMessage(""); setRegFullName(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            <input key="reg-login" type='email' value={loginEmail} placeholder="Email (Логин)" onChange={(e) => { setMessage(""); setLoginEmail(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            <input key="reg-phone" type='text' value={regPhone} placeholder="Телефон" onChange={(e) => { setMessage(""); setRegPhone(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            <input key="reg-pass" type='password' value={loginPassword} placeholder="Пароль" onChange={(e) => { setMessage(""); setLoginPassword(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            <input key="reg-pass2" type='password' value={regPasswordRepeat} placeholder="Повторите пароль" onChange={(e) => { setMessage(""); setRegPasswordRepeat(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            
            <button type="submit" style={{ padding: "10px 24px", width: "100%", marginTop: "10px", cursor: "pointer" }}>Зарегистрироваться</button>
            
            <button 
              type="button" 
              onClick={() => resetInterfaceModes("login")}
              style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer", marginTop: "5px" }}
            >
              Уже есть аккаунт? Войти
            </button>
           </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginTop: "15px" }}>
            <input key="auth-login" type='email' value={loginEmail} placeholder="Email (Логин)" onChange={(e) => { setMessage(""); setLoginEmail(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            <input key="auth-pass" type='password' value={loginPassword} placeholder="Пароль" onChange={(e) => { setMessage(""); setLoginPassword(e.target.value); }} style={{ width: "100%", padding: "10px", boxSizing: "border-box" }} />
            
            <button type="submit" style={{ padding: "10px 24px", width: "100%", marginTop: "10px", cursor: "pointer" }}>Войти</button>
            
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: "15px", fontSize: "0.9rem" }}>
              <button 
                type="button" 
                onClick={() => resetInterfaceModes("register")}
                style={{ background: "none", border: "none", color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
              >
                Регистрация
              </button>
              <button 
                type="button" 
                onClick={() => resetInterfaceModes("forgot")}
                style={{ background: "none", border: "none", color: "#dc3545", textDecoration: "underline", cursor: "pointer" }}
              >
                Забыли пароль?
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}