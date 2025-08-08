import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SelfGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (req.user.role === 'admin') {
      return true;
    }
    if (req.params.id !== req.user.sub) {
      throw new ForbiddenException('Forbidden user');
    }
    return true;
  }
}
