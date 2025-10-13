import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '../libs/api'
import type { loginData } from '../types/Index.ts';
import type { AxiosError } from 'axios';

export const useAuthenticateUser = () => {
    const queryClient = useQueryClient();
    const { mutate: authenticateUser, isPending: isLoading, error } = useMutation<unknown, AxiosError<{ message: string }>, loginData>({
        mutationFn: login,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['authUser']
            })
        }
    })

    return { authenticateUser, isLoading, error};
}
