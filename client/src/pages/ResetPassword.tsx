import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [strengthLevel, setStrengthLevel] = useState(0);

    // Verify Token on Mount
    useEffect(() => {
        const verifyToken = async () => {
            try {
                await api.get(`/auth/verify-reset-token/${token}`);
                setIsValidToken(true);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setIsValidToken(false);
                // toast.error("Invalid or expired reset link");
            } finally {
                setVerifying(false);
            }
        };
        verifyToken();
    }, [token]);

    // Password Strength Logic
    useEffect(() => {
        let score = 0;
        if (formData.password.length > 6) score++;
        if (formData.password.length > 10) score++;
        if (/[0-9]/.test(formData.password)) score++;
        if (/[^A-Za-z0-9]/.test(formData.password)) score++;
        setStrengthLevel(score);
    }, [formData.password]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        if (strengthLevel < 3) {
            return toast.error("Please create a stronger password (use mix of chars, numbers, symbols)");
        }

        setLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { password: formData.password });
            toast.success("Password updated! Please login.");
            navigate('/login');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reset password");
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black z-0" />

                <div className="w-full max-w-md p-6 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6 border border-red-500/20">
                        <AlertCircle className="text-red-500 w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Link Expired</h1>
                    <p className="text-gray-400 font-medium mb-8">This password reset link is invalid or has expired.</p>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wide text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black z-0" />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] z-0" />

            <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6">
                        <KeyRound className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Reset Password</h1>
                    <p className="text-gray-400 text-sm font-medium">Create a new secure password</p>
                </div>

                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-4">
                            {/* Password input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-gray-950/50 text-white pl-11 pr-4 py-4 rounded-xl border border-gray-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-gray-900 transition-all outline-none placeholder:text-gray-700 font-medium tracking-widest"
                                    placeholder="New Password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Strength Indicator */}
                            <div className="flex gap-1 h-1 px-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strengthLevel ? (strengthLevel > 2 ? 'bg-emerald-500' : 'bg-yellow-500') : 'bg-gray-800'}`} />
                                ))}
                            </div>

                            {/* Confirm Password input */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-gray-950/50 text-white pl-11 pr-4 py-4 rounded-xl border border-gray-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-gray-900 transition-all outline-none placeholder:text-gray-700 font-medium tracking-widest"
                                    placeholder="Confirm Password"
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                <>Reset Password <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>
                <div className="mt-8 flex justify-center gap-4 text-xs text-gray-600 font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Reset Flow</span>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
