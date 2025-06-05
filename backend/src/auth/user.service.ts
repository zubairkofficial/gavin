import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcrypt';
import { FindOptionsWhere, Repository } from 'typeorm/index';
import { UpdateUserDTO } from './dto/update.dto';
import { User } from './entities/user.entity';
import { ICreateUser } from './user.types';
import { ToggleUserStatusInput } from './dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async createUser(input: ICreateUser) {
    const user = new User();
    user.email = input.email;
    user.password = input.password;

    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  async getById(id: string) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not Found');
    }

    return user;
  }

  async getByEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not Found');
    }

    return user;
  }

  async updateUserByFilters(
    filters: FindOptionsWhere<User>,
    input: UpdateUserDTO | { isEmailVerified?: boolean, isActive?: boolean },
  ) {
    const user = await this.usersRepository.findOneBy(filters);
    if (!user) {
      throw new NotFoundException('User not Found');
    }

    const payload = {
      ...input,
    };

    Object.keys(payload).forEach(function (key) {
      if (
        !payload[key] &&
        key != 'proposalEmailNotifications' &&
        key != 'proposalStatusEmailNotifications'
      )
        delete payload[key];
    });

    if (payload?.['password']) {
      payload['password'] = hashSync(payload['password'], 10);
    }

    Object.assign(user, payload);

    return this.usersRepository.save(user);
  }

  async deleteUserByFilters(filters: FindOptionsWhere<User>) {
    await this.usersRepository.delete(filters);
  }

  async findAllUsers(filters?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters?.search) {
      query.andWhere('user.fullName LIKE :search OR user.email LIKE :search', { search: `%${filters.search}%` });
    }
    if (typeof filters?.isActive === 'boolean') {
      query.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters?.sortBy) {
      query.orderBy(`user.${filters.sortBy}`, filters.sortOrder === 'desc' ? 'DESC' : 'ASC');
    }

    let page = filters?.page && filters.page > 0 ? filters.page : 1;
    let limit = filters?.limit && filters.limit > 0 ? filters.limit : 10;

    if (filters?.page && filters?.limit) {
      query.skip((page - 1) * limit).take(limit);
    }

    const [users, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    // Exclude password field from each user
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return {
      data: usersWithoutPassword,
      page: page,
      totalPages,
      total,
      limit,
    };
  }

  async toggleUserStatus(input: ToggleUserStatusInput) {
    const user = await this.usersRepository.findOneBy({ id: input.userId });
    if (!user) {
      throw new NotFoundException('User not Found');
    }
    user.isActive = !user.isActive;
    await this.usersRepository.save(user);

    return {
      message: 'User status toggled successfully',
    };
  }
}
