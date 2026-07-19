import { useEffect, useState } from "react";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { loginUser, registerUser } from "../APIs/userAPI";

function LoginPage({ setCurrentUser }) {
    // ==========================
    // State
    // ==========================
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [user, setUser] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [isLogin, setIsLogin] = useState(true);

    // ==========================
    // Load data when page opens
    // ==========================
    useEffect(() => {
        loadData();
    }, []);

    // ==========================
    // Functions
    // ==========================
    async function loadData() {
        try {
            setLoading(true);
            setError("");

            // Example API call
            // const response = await axios.get("/api/items");
            // setData(response.data);

            setData([]);
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    function validateUser(user) {
        if (!user.email.trim()) {
            return "Email is required.";
        }

        if (!user.email.includes("@")) {
            return "Invalid email.";
        }

        if (!user.password) {
            return "Password is required.";
        }

        if (!isLogin) {
            if (!user.username.trim()) {
                return "Username is required.";
            }

            if (user.password.length < 6) {
                return "Password must be at least 6 characters.";
            }

            if (user.password !== user.confirmPassword) {
                return "Passwords do not match.";
            }
        }

        return null;
    }

    async function handleSubmit(event) {
        // Prevent the browser from refreshing the page
        event.preventDefault();
        setError("");
        const validUserError = validateUser(user);
        if (validUserError) {
            setError(validUserError);
            return;
        }
        setLoading(true);

        let data
        // TODO: Add login logic here
        try {
            if (isLogin) {

                data = await loginUser({ email: user.email, password: user.password });

            } else {
                data = await registerUser({ username: user.username, email: user.email, password: user.password, confirmPassword: user.confirmPassword });
            }
            localStorage.setItem("token", data.token);
            setCurrentUser(data.user);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function loginForm() {
        return (<form onSubmit={handleSubmit}>

            <TextInput
                label="Email"
                name="email"
                value={user.email}
                onChange={(e) => setUser((previousUser) => ({
                    ...previousUser,
                    email: e.target.value,
                }))}
            />

            <TextInput
                label="Password"
                name="password"
                type="password"
                value={user.password}
                onChange={(e) => setUser((previousUser) => ({
                    ...previousUser,
                    password: e.target.value,
                }))}
            />


            <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
            </Button>

        </form>);
    }

    function registerForm() {
        return (<form onSubmit={handleSubmit}>
            <TextInput
                label="Username"
                name="username"
                value={user.username}
                onChange={(e) =>
                    setUser((previousUser) => ({
                        ...previousUser,
                        username: e.target.value,
                    }))
                }
            />

            <TextInput
                label="Email"
                type="email"
                name="email"
                value={user.email}
                onChange={(e) =>
                    setUser((previousUser) => ({
                        ...previousUser,
                        email: e.target.value,
                    }))
                }
            />

            <TextInput
                label="Password"
                type="password"
                name="password"
                value={user.password}
                onChange={(e) =>
                    setUser((previousUser) => ({
                        ...previousUser,
                        password: e.target.value,
                    }))
                }
            />

            <TextInput
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={user.confirmPassword}
                onChange={(e) =>
                    setUser((previousUser) => ({
                        ...previousUser,
                        confirmPassword: e.target.value,
                    }))
                }
            />

            <Button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Register"}
            </Button>
        </form>);
    }

    // ==========================
    // Render
    // ==========================
    return (
        <div className="container py-4">

            <div>
                <Button onClick={() => setIsLogin(true)}>
                    Login
                </Button>

                <Button onClick={() => setIsLogin(false)}>
                    Register
                </Button>
            </div>
            {isLogin ? loginForm() : registerForm()}

            {error && <p>{error}</p>}

        </div >
    );
}

export default LoginPage;