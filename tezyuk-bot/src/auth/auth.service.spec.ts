import { UnauthorizedException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const mockPrisma = {
  admin: {
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mockPrisma as never, mockJwtService as never);
  });

  describe('validateAdmin', () => {
    it('admin topilmasa UnauthorizedException tashlaydi', async () => {
      mockPrisma.admin.findUnique.mockResolvedValueOnce(null);
      await expect(service.validateAdmin('notfound', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('parol noto\'g\'ri bo\'lsa UnauthorizedException tashlaydi', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.admin.findUnique.mockResolvedValueOnce({
        id: 'admin-1',
        username: 'admin',
        passwordHash: hash,
        role: AdminRole.superadmin,
        createdAt: new Date(),
      });
      await expect(service.validateAdmin('admin', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('to\'g\'ri ma\'lumotlar bilan admin qaytaradi', async () => {
      const hash = await bcrypt.hash('correct', 10);
      const fakeAdmin = {
        id: 'admin-1',
        username: 'admin',
        passwordHash: hash,
        role: AdminRole.superadmin,
        createdAt: new Date(),
      };
      mockPrisma.admin.findUnique.mockResolvedValueOnce(fakeAdmin);
      const result = await service.validateAdmin('admin', 'correct');
      expect(result).toEqual(fakeAdmin);
    });
  });

  describe('login', () => {
    it('to\'g\'ri login da accessToken qaytaradi', async () => {
      const hash = await bcrypt.hash('password', 10);
      mockPrisma.admin.findUnique.mockResolvedValueOnce({
        id: 'admin-1',
        username: 'admin',
        passwordHash: hash,
        role: AdminRole.moderator,
        createdAt: new Date(),
      });

      const result = await service.login('admin', 'password');

      expect(result.accessToken).toBe('signed-token');
      expect(result.admin.username).toBe('admin');
      expect(result.admin.role).toBe(AdminRole.moderator);
    });
  });
});
