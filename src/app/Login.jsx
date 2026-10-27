import React, { useState } from "react";
import "./Login.css";

function Login() {

    const [userType, setUserType] = useState("farmer");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleLogin(event) {
        event.preventDefault();

        console.log({
            userType,
            email,
            password
        });

        alert("Login form submitted successfully!");
    }

    return (
        <div className="login-page">

            <div className="login-container">

                {/* AgriLink Brand */}
                <div className="brand">
                    <h1>AgriLink</h1>
                    <p>Every harvest has a next move.</p>
                </div>

                <h2>Welcome Back</h2>

                <p className="login-description">
                    Select your account type to continue.
                </p>

                {/* User Type Selection */}
                <div className="role-selection">

                    <button
                        type="button"
                        className={
                            userType === "farmer"
                                ? "role-btn active"
                                : "role-btn"
                        }
                        onClick={() => setUserType("farmer")}
                    >
                        Farmer
                    </button>

                    <button
                        type="button"
                        className={
                            userType === "storage"
                                ? "role-btn active"
                                : "role-btn"
                        }
                        onClick={() => setUserType("storage")}
                    >
                        Storage Owner
                    </button>

                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="login-options">

                        <label>
                            <input type="checkbox" />
                            Remember me
                        </label>

                        <a href="/forgot-password">
                            Forgot password?
                        </a>

                    </div>

                    <button type="submit" className="login-submit">

                        Login as {
                            userType === "farmer"
                                ? "Farmer"
                                : "Storage Owner"
                        }

                    </button>

                </form>

                <p className="register-text">
                    Don't have an account?
                    <a href="/register"> Register here</a>
                </p>

            </div>

        </div>
    );
}

export default Login;