import { logout } from "../libs/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
    const queryClient = useQueryClient();

    const { mutate: logoutMutation } = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.setQueryData(["authUser"], null);
        }
    })

    return { logoutMutation };
}