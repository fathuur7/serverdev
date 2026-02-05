import { PackageService } from "../services/packages/package.service";
import { Context } from "elysia";
import { CreatePackageInput } from "../types/package.types";

export class PackageController {
    private packageService: PackageService;

    constructor() {
        this.packageService = new PackageService();
    }

    // GET all packages
    getAll = async ({ set }: Context) => {
        try {
            const packages = await this.packageService.getAllPackages();
            return { success: true, data: packages };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // GET active packages only
    getActive = async ({ set }: Context) => {
        try {
            const packages = await this.packageService.getActivePackages();
            return { success: true, data: packages };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // GET package by id
    getById = async ({ params, set }: Context) => {
        try {
            const id = (params as any).id as string;
            const pkg = await this.packageService.getPackageById(id);
            return { success: true, data: pkg };
        } catch (error) {
            set.status = 404;
            return { success: false, message: (error as Error).message };
        }
    };

    // POST create package
    create = async ({ body, set }: Context) => {
        try {
            const pkg = await this.packageService.createPackage(body as CreatePackageInput);
            set.status = 201;
            return { success: true, data: pkg };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // PUT update package
    update = async ({ params, body, set }: Context) => {
        try {
            const id = (params as any).id as string;
            const pkg = await this.packageService.updatePackage(id, body as Partial<CreatePackageInput>);
            return { success: true, data: pkg };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // DELETE package
    delete = async ({ params, set }: Context) => {
        try {
            const id = (params as any).id as string;
            await this.packageService.deletePackage(id);
            return { success: true, message: "Package deleted successfully" };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // PATCH toggle active status
    toggleActive = async ({ params, set }: Context) => {
        try {
            const id = (params as any).id as string;
            const pkg = await this.packageService.toggleActive(id);
            return { success: true, data: pkg };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };
}
