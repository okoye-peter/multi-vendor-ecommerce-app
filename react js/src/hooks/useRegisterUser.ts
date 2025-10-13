import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register } from '../libs/api.ts';
import { AxiosError } from "axios";
import type { registrationData } from '../types/index.ts';

export const useRegisterUser = () => {

    const queryClient = useQueryClient();
    const { mutate: registrationMutation, isPending, error } = useMutation<unknown, AxiosError<{ message: string }>, registrationData>({
        mutationFn: register,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authUser'] })
    })

    return { registrationMutation, isPending, error };
}
