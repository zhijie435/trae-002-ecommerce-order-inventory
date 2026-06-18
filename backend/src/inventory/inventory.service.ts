import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Inventory, InventoryType, InventorySource } from './inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  private async getCurrentStock(sku: string): Promise<number> {
    const latestRecord = await this.inventoryRepository.findOne({
      where: { sku },
      order: { createdAt: 'DESC' },
    });
    return latestRecord ? latestRecord.stockAfter : 0;
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const stockBefore = await this.getCurrentStock(createInventoryDto.sku);
    let stockAfter: number;

    switch (createInventoryDto.type) {
      case InventoryType.IN:
        stockAfter = stockBefore + createInventoryDto.quantity;
        break;
      case InventoryType.OUT:
        if (stockBefore < createInventoryDto.quantity) {
          throw new BadRequestException(`库存不足，当前库存: ${stockBefore}，出库数量: ${createInventoryDto.quantity}`);
        }
        stockAfter = stockBefore - createInventoryDto.quantity;
        break;
      case InventoryType.ADJUST:
        stockAfter = createInventoryDto.quantity;
        break;
      default:
        throw new BadRequestException('无效的库存类型');
    }

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      stockBefore,
      stockAfter,
    });

    return this.inventoryRepository.save(inventory);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    sku?: string,
    type?: InventoryType,
    source?: InventorySource,
  ): Promise<{ data: Inventory[]; total: number }> {
    const query = this.inventoryRepository.createQueryBuilder('inventory')
      .orderBy('inventory.createdAt', 'DESC');

    if (sku) {
      query.where('inventory.sku LIKE :sku', { sku: `%${sku}%` });
    }
    if (type) {
      query.andWhere('inventory.type = :type', { type });
    }
    if (source) {
      query.andWhere('inventory.source = :source', { source });
    }

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new NotFoundException(`Inventory record with ID ${id} not found`);
    }
    return inventory;
  }

  async getStockBySku(sku: string): Promise<number> {
    return this.getCurrentStock(sku);
  }

  async getAllStockSummary(): Promise<{ sku: string; productName: string; stock: number }[]> {
    const skus = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select('DISTINCT inventory.sku, inventory.productName')
      .getRawMany();

    const result = [];
    for (const item of skus) {
      const stock = await this.getCurrentStock(item.sku);
      result.push({
        sku: item.sku,
        productName: item.productName,
        stock,
      });
    }
    return result.sort((a, b) => b.stock - a.stock);
  }

  async getLowStock(threshold: number = 10): Promise<{ sku: string; productName: string; stock: number }[]> {
    const allStock = await this.getAllStockSummary();
    return allStock.filter(item => item.stock <= threshold);
  }
}
