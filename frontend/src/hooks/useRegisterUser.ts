import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '../libs/api.ts';
import { AxiosError } from "axios";
// import type { registrationData } from '../pages/auth/Register.tsx';
// import type { registrationData } from '../types/Index.ts';

export const useRegisterUser = () => {

    const queryClient = useQueryClient();
    const { mutate: registrationMutation, isPending, error } = useMutation<unknown, AxiosError<{ message: string }>, FormData>({
        mutationFn: register,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] })
    })

    return { registrationMutation, isPending, error };
}
