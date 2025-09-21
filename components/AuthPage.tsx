import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.02,35.636,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signInWithEmail({ email, password });
                if (error) throw error;
            } else {
                const { error } = await signUpWithEmail({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        },
                    },
                });
                if (error) throw error;
                setMessage('Cadastro realizado! Verifique seu e-mail para confirmação.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setError('');
        setMessage('');
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro com o login do Google.');
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 bg-[url('https://tailwindcss.com/_next/static/media/docs@tinypng.61f4d332.png')] bg-cover bg-no-repeat">
            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-lg border border-sky-500/30 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
                        className={`w-1/2 p-4 font-semibold transition-colors duration-300 ${isLogin ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
                        className={`w-1/2 p-4 font-semibold transition-colors duration-300 ${!isLogin ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        Cadastrar
                    </button>
                </div>
                
                <div className="p-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter text-center mb-2">Nexus</h1>
                    <p className="text-slate-400 text-center mb-6">{isLogin ? 'Bem-vindo de volta.' : 'Crie sua conta para começar.'}</p>
                    
                    {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
                    {message && <p className="bg-emerald-900/50 text-emerald-300 p-3 rounded-md mb-4 text-center text-sm">{message}</p>}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" placeholder="Seu nome" />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-1">Sobrenome</label>
                                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" placeholder="Seu sobrenome"/>
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                                placeholder="voce@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-slate-400 mb-1">Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-900 px-2 text-slate-400">Ou continue com</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-semibold text-white transition-colors"
                    >
                        <GoogleIcon />
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
};

// FIX: Add default export to make the component available for import.
export default AuthPage;
