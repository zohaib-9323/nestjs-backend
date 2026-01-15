import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperAdminSecretGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Get the secret key from environment
    const validSecretKey = this.configService.get<string>('SUPERADMIN_SECRET_KEY');
    
    if (!validSecretKey) {
      throw new ForbiddenException(
        'Superadmin secret key not configured on server',
      );
    }

    // Check for secret key in headers (X-Superadmin-Secret)
    const providedSecretKey = request.headers['x-superadmin-secret'];

    if (!providedSecretKey) {
      throw new ForbiddenException(
        'Superadmin secret key required. Provide it in X-Superadmin-Secret header',
      );
    }

    if (providedSecretKey !== validSecretKey) {
      throw new ForbiddenException('Invalid superadmin secret key');
    }

    return true;
  }
}

