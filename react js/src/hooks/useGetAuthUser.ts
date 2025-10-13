import { useQuery } from '@tanstack/react-query'
import { getAuthUser } from '../libs/api.ts'

const useGetAuthUser = () => {
  const authUser = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: 0,
  })

  return {
    isLoading: authUser.isLoading,
    authUser: authUser.data?.user,
    error: authUser.error,
  };
}

export default useGetAuthUser; 