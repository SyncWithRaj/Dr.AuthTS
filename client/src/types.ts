export interface User {
    id: number;
    email: string;
    loginId?: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'USER';
    phone?: string;
    address?: string;
    gender?: string;
    nationality?: string;
    dateOfBirth?: string;
    profilePic?: string;
    googleId?: string;
    githubId?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    updateUser: (newData: Partial<User>) => void;
    login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (userData: any) => Promise<{ success: boolean; message?: string }>;
    logout: (callApi?: boolean) => Promise<void>;
}

export interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}
