import { useEffect, useState } from "react";
import TextInput from "../components/TextInput";
import Button from "../components/Button";

function LoginPage() {
    // ==========================
    // State
    // ==========================
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState([]);
    const [user, setUser] = useState({ username: "", password: "" });
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

    function handleSubmit(event) {
        // Prevent the browser from refreshing the page
        event.preventDefault();

        // TODO: Add login logic here
    }

    // ==========================
    // Render
    // ==========================
    return (
        <div className="container py-4">
            <h1>Home Page</h1>

            {loading && <p>Loading...</p>}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {data.length === 0 ? (
                        <p>No data found.</p>
                    ) : (
                        <ul>
                            {data.map((item) => (
                                <li key={item.id}>
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <div>
                <Button onClick={() => setIsLogin(true)}>
                    Login
                </Button>

                <Button onClick={() => setIsLogin(false)}>
                    Register
                </Button>
            </div>
            {isLogin ? (
            <form onSubmit={handleSubmit}>

                <TextInput
                    label="Username"
                    name="username"
                    value={user.username}
                    onChange={(e) => setUser((previousUser) => ({
                        ...previousUser,
                        username: e.target.value,
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


                <Button type="submit">
                    Login
                </Button>

            </form>
            ): (

            <form onSubmit={handleSubmit}>
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

                <Button type="submit">
                    Register
                </Button>
            </form>
            )}
        </div>
    );
}

export default LoginPage;