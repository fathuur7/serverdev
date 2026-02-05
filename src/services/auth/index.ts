/**
 * Auth Services Barrel Export
 * 
 * Modular authentication services with clear separation of concerns:
 * - Authentication: Login, Register, Logout
 * - Token: Refresh token management
 * - Password: Password hashing and reset
 * - User Management: Admin user operations
 * - Profile: Customer/Technician profiles
 * - OTP: OTP generation and verification
 */

// Export service classes
export { AuthenticationService, authenticationService } from "./authentication.service";
export { TokenService, tokenService } from "./token.service";
export { PasswordService, passwordService } from "./password.service";
export { UserManagementService, userManagementService } from "./user-management.service";
export { ProfileService, profileService } from "./profile.service";
export { OtpService } from "./otp.service";

// Export for backward compatibility (optional - can be removed later)
// This allows existing code to still work while we migrate
import { authenticationService } from "./authentication.service";
import { passwordService } from "./password.service";
import { userManagementService } from "./user-management.service";
import { profileService } from "./profile.service";

export class AuthService {
    // Delegate to new services
    register = authenticationService.register.bind(authenticationService);
    login = authenticationService.login.bind(authenticationService);
    verifyOtp = authenticationService.verifyOtp.bind(authenticationService);
    resendOtp = authenticationService.resendOtp.bind(authenticationService);
    logout = authenticationService.logout.bind(authenticationService);
    logoutAllDevices = authenticationService.logoutAllDevices.bind(authenticationService);
    generateRefreshToken = authenticationService.generateRefreshToken.bind(authenticationService);
    refreshAccessToken = authenticationService.refreshAccessToken.bind(authenticationService);

    forgotPassword = passwordService.forgotPassword.bind(passwordService);
    verifyResetOtp = passwordService.verifyResetOtp.bind(passwordService);
    resetPassword = passwordService.resetPassword.bind(passwordService);

    getUser = userManagementService.getUsers.bind(userManagementService);
    setEmailVerified = userManagementService.setEmailVerified.bind(userManagementService);
    changeUserRole = userManagementService.changeUserRole.bind(userManagementService);

    getProfile = profileService.getProfile.bind(profileService);
    customerProfile = profileService.createCustomerProfile.bind(profileService);
    updateProfile = profileService.updateProfile.bind(profileService);
}
