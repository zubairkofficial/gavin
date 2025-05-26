import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcrypt';
import { FindOptionsWhere, Repository } from 'typeorm/index';
import { UpdateUserDTO } from './dto/update.dto';
import { User } from './entities/user.entity';
import { ICreateUser } from './user.types';

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
}
