import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Admin } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });

    if (!admin) {
      throw new UnauthorizedException("Login yoki parol noto'g'ri");
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Login yoki parol noto'g'ri");
    }

    return admin;
  }

  async login(username: string, password: string) {
    const admin = await this.validateAdmin(username, password);
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      admin: payload,
    };
  }
}
