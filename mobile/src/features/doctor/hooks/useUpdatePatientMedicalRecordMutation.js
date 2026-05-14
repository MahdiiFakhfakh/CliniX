import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { updatePatientMedicalRecord } from '@/src/services/api/endpoints/doctorActionsApi';

export function useUpdatePatientMedicalRecordMutation(patientId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePatientMedicalRecord,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patientDetail(patientId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.doctor.patients });
        },
    });
}
