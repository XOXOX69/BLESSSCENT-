import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from '../auth/dto/auth.dto';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(options?: { role?: UserRole; branchId?: string; isActive?: boolean; skip?: number; take?: number }) {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.branch', 'branch')
      .where('user.deletedAt IS NULL');

    if (options?.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.role });
    }

    if (options?.branchId) {
      queryBuilder.andWhere('user.branchId = :branchId', { branchId: options.branchId });
    }

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: options.isActive });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip(options?.skip || 0)
      .take(options?.take || 50)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async create(data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role?: UserRole; branchId?: string }): Promise<User> {
    const existingUser = await this.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || UserRole.CASHIER,
      branchId: data.branchId,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const email = (updateData as any).email;
    if (email && email !== user.email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    await this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softDelete(user.id);
  }

  async getCashiers(branchId?: string): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CASHIER })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.deletedAt IS NULL');

    if (branchId) {
      queryBuilder.andWhere('user.branchId = :branchId', { branchId });
    }

    return queryBuilder.getMany();
  }
}
