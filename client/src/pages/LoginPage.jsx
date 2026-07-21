import { useState } from "react";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { loginUser, registerUser } from "../APIs/userAPI";

function LoginPage({ setCurrentUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLogin, setIsLogin] = useState(true);

  function validateUser() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      return "A valid email is required.";
    }
    if (!user.password) return "Password is required.";
    if (!isLogin && !user.username.trim()) return "Username is required.";
    if (!isLogin && (user.password.length < 8 || user.password.length > 128)) {
      return "Password must be between 8 and 128 characters.";
    }
    if (!isLogin && user.password !== user.confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const validationError = validateUser();
    if (validationError) return setError(validationError);
    setLoading(true);

    try {
      const data = isLogin
        ? await loginUser({ email: user.email, password: user.password })
        : await registerUser({
            username: user.username,
            email: user.email,
            password: user.password,
          });
      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setUser((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark" aria-hidden="true">C</div>
        <p className="eyebrow">Welcome to Chatter</p>
        <h1>{isLogin ? "Good to see you" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to continue your conversations."
            : "Join and start chatting in a few seconds."}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <Button type="button" onClick={() => setIsLogin(true)} className={isLogin ? "auth-tab active" : "auth-tab"}>Login</Button>
          <Button type="button" onClick={() => setIsLogin(false)} className={!isLogin ? "auth-tab active" : "auth-tab"}>Register</Button>
        </div>

        {error && <p className="alert-message">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && <TextInput label="Username" name="username" value={user.username} onChange={(event) => updateField("username", event.target.value)} />}
          <TextInput label="Email" type="email" name="email" value={user.email} onChange={(event) => updateField("email", event.target.value)} />
          <TextInput label="Password" type="password" name="password" value={user.password} onChange={(event) => updateField("password", event.target.value)} />
          {!isLogin && <TextInput label="Confirm Password" type="password" name="confirmPassword" value={user.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} />}
          <Button type="submit" disabled={loading} className="primary-button">
            {loading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "Login" : "Register")}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
