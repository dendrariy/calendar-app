import React, { useState } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

interface Props {
    onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLogin();
        } catch (err) {
            setError("Ошибка: " + (err as Error).message);
        }
    };

    return (
        <div className="container is-max-desktop mt-6">
            <div className="box">
                <h1 className="title is-4">
                    {isRegister ? "Регистрация" : "Вход"}
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label className="label">Email</label>
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="label">Пароль</label>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="has-text-danger">{error}</p>}

                    <button className="button is-primary is-fullwidth" type="submit">
                        {isRegister ? "Зарегистрироваться" : "Войти"}
                    </button>
                </form>

                <hr />

                <p className="has-text-centered">
                    {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                    <button
                        className="button is-text"
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister ? "Войти" : "Зарегистрироваться"}
                    </button>
                </p>
            </div>
        </div>
    );
}