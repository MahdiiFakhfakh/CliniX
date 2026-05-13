import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { fetchDoctors } from '@/src/services/api/endpoints/doctorsApi';

export function useDoctorsQuery() {
    return useQuery({
        queryKey: queryKeys.doctors.list,
        queryFn: fetchDoctors,
    });
}
