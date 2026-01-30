import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MagicLoginVerify = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const processedRef = useRef(false);

    useEffect(() => {
        const verifyMagicLink = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            const loadId = toast.loading("Verifying magic link...");

            try {
                const { data } = await api.post('/auth/verify-magic-link', { token });

                if (data.user) {
                    setUser(data.user);
                    toast.success("Welcome back!", { id: loadId });
                    navigate('/profile');
                } else {
                    // Should not happen if backend is correct but handle anyway
                    toast.success("Verified! Please wait...", { id: loadId });
                    window.location.href = '/profile';
                }

            } catch (error: any) {
                console.error("Magic Login Error", error);
                toast.error(error.response?.data?.message || "Invalid or expired link", { id: loadId });
                navigate('/login');
            }
        };

        if (token) {
            verifyMagicLink();
        } else {
            navigate('/login');
        }
    }, [token, navigate, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold mb-2">Verifying Link...</h2>
                <p className="text-gray-400">Please wait while we log you in.</p>
            </div>
        </div>
    );
};

export default MagicLoginVerify;
