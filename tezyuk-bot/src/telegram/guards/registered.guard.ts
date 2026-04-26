import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Context } from 'telegraf';
import { UsersService } from 'src/users/users.service';

type GuardContext = Context & {
  from?: { id: number };
  scene?: { enter(sceneId: string): Promise<void> };
  reply(text: string): Promise<unknown>;
};

@Injectable()
export class RegisteredGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [ctx] = context.getArgs<[GuardContext]>();

    if (!ctx.from) {
      return false;
    }

    const user = await this.usersService.findByTelegramId(BigInt(ctx.from.id));
    if (user) {
      return true;
    }

    await ctx.reply(
      "⚠️ Avval ro'yxatdan o'ting.\n\n/start ni bosing.",
    );
    return false;
  }
}
