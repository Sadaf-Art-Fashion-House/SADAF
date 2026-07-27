export interface ProfileFormData {
    fullName: string;
    bio: string;
    shippingAddress: string;
}

export interface ProfileSaveResult {
    success: boolean;
    message: string;
}
