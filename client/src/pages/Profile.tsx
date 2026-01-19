import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Camera, Save, Edit2, Briefcase, Loader, User } from 'lucide-react';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        firstName: (user as any)?.firstName || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lastName: (user as any)?.lastName || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phone: (user as any)?.phone || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: (user as any)?.email || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dateOfBirth: (user as any)?.dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : '', // Format YYYY-MM-DD
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        address: (user as any)?.address || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nationality: (user as any)?.nationality || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        personalEmail: (user as any)?.personalEmail || '', // Assuming UI field.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gender: (user as any)?.gender || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maritalStatus: (user as any)?.maritalStatus || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profilePic: (user as any)?.profilePic || ''
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFileChange = (e: any) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file)); // Local preview
        }
    };

    const handleCameraClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const loadId = toast.loading("Updating profile...");

        try {
            const data = new FormData();
            (Object.keys(formData) as (keyof typeof formData)[]).forEach(key => {
                if (formData[key]) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.append(key, formData[key] as any);
                }
            });

            if (selectedFile) {
                data.append('profilePic', selectedFile);
            }

            const response = await api.put('/users/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateUser(response.data);
            setIsEditing(false);
            toast.success("Profile updated successfully!", { id: loadId });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile", { id: loadId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* HEADER / COVER AREA */}
            <div className="relative h-64 rounded-3xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 animate-gradient-x"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-end md:items-center gap-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    {/* AVATAR */}
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-3xl border-4 border-gray-900 shadow-2xl overflow-hidden bg-gray-800 flex items-center justify-center relative group">
                            {previewImage || formData.profilePic ? (
                                <img src={previewImage || formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-white">
                                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                                </span>
                            )}

                            {/* Overlay for Editing */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" size={24} />
                                </div>
                            )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Edit Icon Badge */}
                        {isEditing && (
                            <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-2 border-gray-800 text-white cursor-pointer hover:bg-indigo-500 shadow-lg"
                                onClick={handleCameraClick}>
                                <Camera size={16} />
                            </div>
                        )}
                    </div>

                    {/* INFO SECTION */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3">
                                    {isEditing ? (
                                        <div className="flex gap-2 mb-1">
                                            <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="bg-gray-700 border border-gray-600 text-white px-3 py-1 rounded-lg w-32 focus:outline-none focus:border-indigo-500" />
                                            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="bg-gray-700 border border-gray-600 text-white px-3 py-1 rounded-lg w-32 focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    ) : (
                                        <h1 className="text-3xl font-bold text-white tracking-wide">
                                            {formData.firstName} {formData.lastName}
                                        </h1>
                                    )}
                                </div>
                                <p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
                                    <Briefcase size={14} className="text-indigo-400" /> {user?.role}
                                </p>
                            </div>

                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg active:scale-95
                            ${isEditing
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : (isEditing ? <><Save size={18} /> Save Changes</> : <><Edit2 size={18} /> Edit Profile</>)}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-700 mt-6">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Email</label>
                                <p className="text-white font-medium">{formData.email}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Mobile Contact</label>
                                {isEditing ? (
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="bg-gray-700 border border-gray-600 text-white px-3 py-1 rounded-lg w-full text-sm focus:outline-none focus:border-indigo-500" />
                                ) : (
                                    <p className="text-gray-300 font-medium">{formData.phone || "--"}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Personal Details */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-white mb-6 flex items-center uppercase tracking-widest border-b border-gray-700 pb-2">
                            <User className="mr-2 text-indigo-500" size={18} /> Personal Details
                        </h3>
                        <InputField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} disabled={!isEditing} />
                        <InputField label="Address" name="address" value={formData.address} onChange={handleChange} disabled={!isEditing} />
                        <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} disabled={!isEditing} />
                        <InputField label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} disabled={!isEditing} />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Gender" name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing} />
                            <InputField label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} disabled={!isEditing} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Reusable Input Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InputField = ({ label, name, type = "text", value, onChange, disabled }: any) => (
    <div className="space-y-1 group">
        <label className="text-gray-500 text-[10px] uppercase font-black tracking-widest transition-colors group-focus-within:text-indigo-400 ml-1">{label}</label>
        {disabled ? (
            <div className="w-full bg-gray-900/50 text-gray-400 px-4 py-3 rounded-xl border border-gray-700/50 font-medium text-sm min-h-[48px] flex items-center cursor-not-allowed">
                {value || <span className="opacity-20 italic">Not set</span>}
            </div>
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm font-medium placeholder:text-gray-600"
                placeholder={`Enter ${label}`}
            />
        )}
    </div>
);

export default Profile;