/**
 * NIK (Nomor Induk Kependudukan) Validator
 * Standard validation: 16 digits + birth date format validation
 *
 * NIK Format:
 * - 6 digits: Region code (Province, City, District)
 * - 6 digits: Birth date (DDMMYY, females: DD+40)
 * - 4 digits: Sequential number
 */

export interface NikValidationResult {
    valid: boolean;
    message?: string;
    data?: {
        regionCode: string;
        birthDate: Date;
        gender: "male" | "female";
        sequentialNumber: string;
    };
}

/**
 * Validate NIK with standard validation
 * Checks: 16 digits, valid birth date format
 */
export function validateNik(nik: string): NikValidationResult {
    // Remove any whitespace
    const cleanNik = nik.replace(/\s/g, "");

    // Check length
    if (cleanNik.length !== 16) {
        return {
            valid: false,
            message: "NIK harus 16 digit",
        };
    }

    // Check if all digits
    if (!/^\d{16}$/.test(cleanNik)) {
        return {
            valid: false,
            message: "NIK hanya boleh berisi angka",
        };
    }

    // Extract parts
    const regionCode = cleanNik.substring(0, 6);
    const birthDatePart = cleanNik.substring(6, 12);
    const sequentialNumber = cleanNik.substring(12, 16);

    // Parse birth date
    let day = parseInt(birthDatePart.substring(0, 2), 10);
    const month = parseInt(birthDatePart.substring(2, 4), 10);
    let year = parseInt(birthDatePart.substring(4, 6), 10);

    // Determine gender (females have day + 40)
    let gender: "male" | "female" = "male";
    if (day > 40) {
        day -= 40;
        gender = "female";
    }

    // Validate day (1-31)
    if (day < 1 || day > 31) {
        return {
            valid: false,
            message: "Format tanggal lahir di NIK tidak valid",
        };
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
        return {
            valid: false,
            message: "Format bulan lahir di NIK tidak valid",
        };
    }

    // Convert 2-digit year to 4-digit
    // Assume: 00-29 = 2000-2029, 30-99 = 1930-1999
    const currentYear = new Date().getFullYear();
    const currentYearShort = currentYear % 100;
    if (year <= currentYearShort + 5) {
        year += 2000;
    } else {
        year += 1900;
    }

    // Validate year (reasonable range: 1900-current)
    if (year < 1900 || year > currentYear) {
        return {
            valid: false,
            message: "Tahun lahir di NIK tidak valid",
        };
    }

    // Create birth date
    const birthDate = new Date(year, month - 1, day);

    // Validate the date is real (e.g., not Feb 30)
    if (
        birthDate.getDate() !== day ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getFullYear() !== year
    ) {
        return {
            valid: false,
            message: "Tanggal lahir di NIK tidak valid",
        };
    }

    // Check not future date
    if (birthDate > new Date()) {
        return {
            valid: false,
            message: "Tanggal lahir di NIK tidak boleh di masa depan",
        };
    }

    return {
        valid: true,
        data: {
            regionCode,
            birthDate,
            gender,
            sequentialNumber,
        },
    };
}

/**
 * Simple NIK check for Elysia validation
 * Returns true if valid, throws error message if invalid
 */
export function isValidNik(nik: string): boolean {
    const result = validateNik(nik);
    if (!result.valid) {
        throw new Error(result.message);
    }
    return true;
}
