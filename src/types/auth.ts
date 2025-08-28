export interface User {
    _id: string;
    name: string;
    email: string;
    password: string;
}


export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}
