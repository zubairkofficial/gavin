import { DataSource } from 'typeorm';

// Define Type interface if not provided by typeorm
export interface Type<T, DBType> {
  getName(): string;
  getSQLType(platform: string): string;
  convertToJSValue(value: DBType, platform: string): T;
  convertToDatabaseValue(value: T, platform: string): DBType;
}

export class VectorType implements Type<number[], string> {
  private dimension: number;

  constructor(dimension: number) {
    this.dimension = dimension;
  }

  getName() {
    return 'vector';
  }

  getSQLType(platform: string): string {
    return 'vector';
  }

  convertToJSValue(value: string, _platform: string): number[] {
    if (!value) return [];
    return value.slice(1, -1).split(',').map(Number);
  }

  convertToDatabaseValue(value: number[], _platform: string): string {
    if (!value) return `[${Array(this.dimension).fill(0).join(',')}]`;
    if (value.length !== this.dimension) {
      throw new Error(`Vector must have exactly ${this.dimension} dimensions`);
    }
    return `[${value.join(',')}]`;
  }
}
