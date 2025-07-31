import { useMutation } from '@tanstack/react-query';
import API from '@/lib/api';


export const useUpdateUser = () => {
    return useMutation({
        mutationKey: ['updateUser'],
        mutationFn: async (data: any) => {
            const response = await API.post('/auth/user/update', data);

            if (response.status < 200 || response.status >= 300) {
                throw new Error('Failed to update profile');
            }

            return response.data;
        },
    });
};
