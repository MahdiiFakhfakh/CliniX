import { apiRequest } from '@/src/services/api/client';

const mapDoctor = (item) => {
    const fullName = item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
    const specialty = item.specialization ?? item.department ?? 'General Medicine';

    return {
        id: item._id ?? item.id,
        doctorId: item.doctorId,
        name: fullName || 'Unknown Doctor',
        email: item.email,
        phone: item.phone,
        specialty,
        department: item.department ?? specialty,
        qualifications: Array.isArray(item.qualifications) ? item.qualifications : [],
        hospital: item.hospital ?? 'CliniX',
        bio: item.bio,
        years: Number.isFinite(item.experience) ? item.experience : 0,
        reviews: Number.isFinite(item.totalReviews) ? item.totalReviews : 0,
        rating: Number.isFinite(item.rating) ? item.rating : 4.5,
        status: item.status ?? 'available',
        available: item.status === undefined || item.status === 'available',
        consultationFee: Number.isFinite(item.consultationFee) ? item.consultationFee : 0,
    };
};

export async function fetchDoctors() {
    const response = await apiRequest({
        method: 'GET',
        url: '/doctors',
    });

    if (!response.success || !Array.isArray(response.doctors)) {
        throw new Error('Invalid doctors response');
    }

    return response.doctors.map(mapDoctor);
}
