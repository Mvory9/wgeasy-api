import { ValidationException } from '../exceptions/WgEasyExceptions';
import { IClientCreateDTO, IClientUpdateDTO } from '../types';

export class Validator {
    private static readonly NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
    private static readonly MIN_NAME_LENGTH = 1;
    private static readonly MAX_NAME_LENGTH = 64;

    public static validateClientName(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new ValidationException('name', 'Name is required and must be a string', name);
        }

        const trimmedName = name.trim();

        if (trimmedName.length < this.MIN_NAME_LENGTH) {
            throw new ValidationException(
                'name',
                `Name must be at least ${this.MIN_NAME_LENGTH} character(s)`,
                name
            );
        }

        if (trimmedName.length > this.MAX_NAME_LENGTH) {
            throw new ValidationException(
                'name',
                `Name must not exceed ${this.MAX_NAME_LENGTH} characters`,
                name
            );
        }

        if (!this.NAME_REGEX.test(trimmedName)) {
            throw new ValidationException(
                'name',
                'Name can only contain alphanumeric characters, underscores, and hyphens',
                name
            );
        }
    }

    public static validateClientCreateDTO(dto: IClientCreateDTO): void {
        this.validateClientName(dto.name);
    }

    public static validateClientUpdateDTO(dto: IClientUpdateDTO): void {
        if (dto.name !== undefined) {
            this.validateClientName(dto.name);
        }

        if (dto.enabled !== undefined && typeof dto.enabled !== 'boolean') {
            throw new ValidationException('enabled', 'Enabled must be a boolean', dto.enabled);
        }

        if (dto.address !== undefined) {
            this.validateIPAddress(dto.address);
        }
    }

    public static validateIPAddress(address: string): void {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;

        if (!ipv4Regex.test(address) && !ipv6Regex.test(address)) {
            throw new ValidationException('address', 'Invalid IP address format', address);
        }
    }

    public static validateId(id: string): void {
        if (!id) {
            throw new ValidationException('id', 'ID is required and must be a string', id);
        }

        if (id.trim().length === 0) {
            throw new ValidationException('id', 'ID cannot be empty', id);
        }
    }
}