export type TechnicianStatus = 'IDLE' | 'ON_JOB' | 'OFF_DUTY';

export interface CreateTechnicianInput {
    email: string;
    password: string;
    employeeId: string;
    fullName: string;
    phoneNumber: string;
    specialization: string;
}

export interface UpdateTechnicianInput {
    fullName?: string;
    phoneNumber?: string;
    specialization?: string;
    currentStatus?: TechnicianStatus;
}
