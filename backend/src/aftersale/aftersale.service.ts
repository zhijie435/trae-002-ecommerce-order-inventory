import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AfterSale, AfterSaleStatus, AfterSaleType } from './aftersale.entity';
import { CreateAfterSaleDto } from './dto/create-aftersale.dto';
import { UpdateAfterSaleDto } from './dto/update-aftersale.dto';
import { OrderService } from '../order/order.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryType, InventorySource } from '../inventory/inventory.entity';

@Injectable()
export class AfterSaleService {
  constructor(
    @InjectRepository(AfterSale)
    private afterSaleRepository: Repository<AfterSale>,
    private orderService: OrderService,
    private inventoryService: InventoryService,
  ) {}

  async create(createAfterSaleDto: CreateAfterSaleDto): Promise<AfterSale> {
    const order = await this.orderService.findOne(createAfterSaleDto.orderId);
    
    const afterSale = this.afterSaleRepository.create(createAfterSaleDto);
    return this.afterSaleRepository.save(afterSale);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    status?: AfterSaleStatus,
    type?: AfterSaleType,
  ): Promise<{ data: AfterSale[]; total: number }> {
    const query = this.afterSaleRepository.createQueryBuilder('afterSale')
      .leftJoinAndSelect('afterSale.order', 'order')
      .orderBy('afterSale.createdAt', 'DESC');

    if (status) {
      query.where('afterSale.status = :status', { status });
    }
    if (type) {
      query.andWhere('afterSale.type = :type', { type });
    }

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<AfterSale> {
    const afterSale = await this.afterSaleRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!afterSale) {
      throw new NotFoundException(`AfterSale with ID ${id} not found`);
    }
    return afterSale;
  }

  async update(id: number, updateAfterSaleDto: UpdateAfterSaleDto): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    Object.assign(afterSale, updateAfterSaleDto);
    return this.afterSaleRepository.save(afterSale);
  }

  async remove(id: number): Promise<void> {
    const result = await this.afterSaleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`AfterSale with ID ${id} not found`);
    }
  }

  async approve(id: number): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status !== AfterSaleStatus.PENDING) {
      throw new BadRequestException('只有待审核状态的售后单才能审批');
    }

    afterSale.status = AfterSaleStatus.APPROVED;
    afterSale.approvedAt = new Date();

    return this.afterSaleRepository.save(afterSale);
  }

  async reject(id: number, rejectReason: string): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status !== AfterSaleStatus.PENDING) {
      throw new BadRequestException('只有待审核状态的售后单才能拒绝');
    }

    afterSale.status = AfterSaleStatus.REJECTED;
    afterSale.rejectReason = rejectReason;

    return this.afterSaleRepository.save(afterSale);
  }

  async processReturn(id: number): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status !== AfterSaleStatus.APPROVED || afterSale.type !== AfterSaleType.RETURN) {
      throw new BadRequestException('只有已通过的退货单才能处理退货入库');
    }

    afterSale.status = AfterSaleStatus.PROCESSING;

    if (afterSale.sku && afterSale.productName && afterSale.quantity) {
      await this.inventoryService.create({
        sku: afterSale.sku,
        productName: afterSale.productName,
        quantity: afterSale.quantity,
        type: InventoryType.IN,
        source: InventorySource.AFTERSALE_RETURN,
        relatedOrderNo: afterSale.order.orderNo,
        relatedAfterSaleNo: afterSale.afterSaleNo,
        operator: afterSale.operator,
        remark: `售后退货入库 - ${afterSale.afterSaleNo}`,
      });
    }

    afterSale.status = AfterSaleStatus.COMPLETED;
    afterSale.completedAt = new Date();

    return this.afterSaleRepository.save(afterSale);
  }

  async processExchange(id: number, newShipmentNo: string): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status !== AfterSaleStatus.APPROVED || afterSale.type !== AfterSaleType.EXCHANGE) {
      throw new BadRequestException('只有已通过的换货单才能处理换货');
    }

    afterSale.status = AfterSaleStatus.PROCESSING;
    afterSale.exchangeShipmentNo = newShipmentNo;

    if (afterSale.sku && afterSale.productName && afterSale.quantity) {
      await this.inventoryService.create({
        sku: afterSale.sku,
        productName: afterSale.productName,
        quantity: afterSale.quantity,
        type: InventoryType.IN,
        source: InventorySource.AFTERSALE_RETURN,
        relatedOrderNo: afterSale.order.orderNo,
        relatedAfterSaleNo: afterSale.afterSaleNo,
        operator: afterSale.operator,
        remark: `售后换货退货入库 - ${afterSale.afterSaleNo}`,
      });

      await this.inventoryService.create({
        sku: afterSale.sku,
        productName: afterSale.productName,
        quantity: afterSale.quantity,
        type: InventoryType.OUT,
        source: InventorySource.AFTERSALE_EXCHANGE,
        relatedOrderNo: afterSale.order.orderNo,
        relatedAfterSaleNo: afterSale.afterSaleNo,
        operator: afterSale.operator,
        remark: `售后换货发货出库 - ${afterSale.afterSaleNo}`,
      });
    }

    afterSale.status = AfterSaleStatus.COMPLETED;
    afterSale.completedAt = new Date();

    return this.afterSaleRepository.save(afterSale);
  }

  async processRefund(id: number): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status !== AfterSaleStatus.APPROVED || afterSale.type !== AfterSaleType.REFUND) {
      throw new BadRequestException('只有已通过的退款单才能处理退款');
    }

    afterSale.status = AfterSaleStatus.PROCESSING;

    afterSale.status = AfterSaleStatus.COMPLETED;
    afterSale.completedAt = new Date();

    return this.afterSaleRepository.save(afterSale);
  }

  async cancel(id: number): Promise<AfterSale> {
    const afterSale = await this.findOne(id);
    
    if (afterSale.status === AfterSaleStatus.COMPLETED || 
        afterSale.status === AfterSaleStatus.REJECTED ||
        afterSale.status === AfterSaleStatus.CANCELLED) {
      throw new BadRequestException('该状态的售后单无法取消');
    }

    afterSale.status = AfterSaleStatus.CANCELLED;

    return this.afterSaleRepository.save(afterSale);
  }
}
