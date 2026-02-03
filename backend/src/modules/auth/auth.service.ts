import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';
import { UserRole, TokenScope } from './enums/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  scope: TokenScope;
  branchId?: string;
  sessionId: string;
}

export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: TokenScope;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, scope = TokenScope.FULL } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    const session = await this.createSession(user, scope, ipAddress, userAgent);

    // Generate tokens
    const tokens = await this.generateTokens(user, session, scope);

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      scope,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone, role, branchId } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });

    if (existingUser && existingUser.deletedAt === null) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: role || UserRole.CASHIER,
      branchId,
    });

    await this.userRepository.save(user);

    // Create session
    const scope = TokenScope.FULL;
    const session = await this.createSession(user, scope);

    // Generate tokens
    const tokens = await this.generateTokens(user, session, scope);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      scope,
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.sessionRepository.softDelete({ id: sessionId, userId });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepository.softDelete({ userId });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });

      const session = await this.sessionRepository.findOne({
        where: { id: payload.sessionId, userId: payload.sub },
        withDeleted: true,
      });

      if (!session || session.deletedAt !== null) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (session.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        withDeleted: true,
      });

      if (!user || !user.isActive || user.deletedAt !== null) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, session, payload.scope);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
        scope: payload.scope,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(user.id, {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
    });

    // Invalidate all sessions
    await this.sessionRepository.softDelete({
      userId: user.id,
    });
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
  }

  private async createSession(
    user: User,
    scope: TokenScope,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash: uuidv4(),
      tokenScope: scope,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent,
    });

    return this.sessionRepository.save(session);
  }

  private async generateTokens(
    user: User,
    session: UserSession,
    scope: TokenScope,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      scope,
      branchId: user.branchId,
      sessionId: session.id,
    };

    const expiresIn = 8 * 60 * 60; // 8 hours for access token

    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    });

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: 7 * 24 * 60 * 60, // 7 days for refresh token
    });

    return { accessToken, refreshToken, expiresIn };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
