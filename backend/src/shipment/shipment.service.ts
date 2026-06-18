import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '../order/order.entity';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryType, InventorySource } from '../inventory/inventory.entity';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    private orderService: OrderService,
    private inventoryService: InventoryService,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const order = await this.orderService.findOne(createShipmentDto.orderId);
    
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('订单已取消，无法发货');
    }

    const shipment = this.shipmentRepository.create(createShipmentDto);
    const savedShipment = await this.shipmentRepository.save(shipment);

    if (createShipmentDto.status === ShipmentStatus.SHIPPED) {
      await this.orderService.updateStatus(createShipmentDto.orderId, OrderStatus.SHIPPED);
      savedShipment.shippedAt = new Date();
    }

    return savedShipment;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    status?: ShipmentStatus,
  ): Promise<{ data: Shipment[]; total: number }> {
    const query = this.shipmentRepository.createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .orderBy('shipment.createdAt', 'DESC');

    if (status) {
      query.where('shipment.status = :status', { status });
    }

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  async update(id: number, updateShipmentDto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findOne(id);
    Object.assign(shipment, updateShipmentDto);
    return this.shipmentRepository.save(shipment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.shipmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
  }

  async ship(id: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    
    if (shipment.status !== ShipmentStatus.PENDING) {
      throw new BadRequestException('只有待发货状态的订单才能发货');
    }

    if (shipment.sku && shipment.productName && shipment.quantity) {
      await this.inventoryService.create({
        sku: shipment.sku,
        productName: shipment.productName,
        quantity: shipment.quantity,
        type: InventoryType.OUT,
        source: InventorySource.SHIPMENT,
        relatedOrderNo: shipment.order?.orderNo,
        relatedShipmentNo: shipment.shipmentNo,
        operator: shipment.operator,
        remark: `订单发货出库 - ${shipment.shipmentNo}`,
      });
    }

    shipment.status = ShipmentStatus.SHIPPED;
    shipment.shippedAt = new Date();

    await this.orderService.updateStatus(shipment.orderId, OrderStatus.SHIPPED);

    return this.shipmentRepository.save(shipment);
  }

  async deliver(id: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    
    if (shipment.status !== ShipmentStatus.SHIPPED) {
      throw new BadRequestException('只有已发货状态的订单才能签收');
    }

    shipment.status = ShipmentStatus.DELIVERED;
    shipment.deliveredAt = new Date();

    await this.orderService.updateStatus(shipment.orderId, OrderStatus.COMPLETED);

    return this.shipmentRepository.save(shipment);
  }

  async cancel(id: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    
    if (shipment.status === ShipmentStatus.DELIVERED || shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException('该状态的发货单无法取消');
    }

    const wasShipped = shipment.status === ShipmentStatus.SHIPPED;
    shipment.status = ShipmentStatus.CANCELLED;

    const savedShipment = await this.shipmentRepository.save(shipment);

    if (wasShipped && shipment.sku && shipment.productName && shipment.quantity) {
      await this.inventoryService.create({
        sku: shipment.sku,
        productName: shipment.productName,
        quantity: shipment.quantity,
        type: InventoryType.IN,
        source: InventorySource.SHIPMENT,
        relatedOrderNo: shipment.order?.orderNo,
        relatedShipmentNo: shipment.shipmentNo,
        operator: shipment.operator,
        remark: `取消发货回库 - ${shipment.shipmentNo}`,
      });
    }

    return savedShipment;
  }
}
