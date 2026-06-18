import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { OrderService } from '../order/order.service';
import { InventoryService } from '../inventory/inventory.service';
import { Shipment, ShipmentStatus, LogisticsCompany } from './shipment.entity';
import { Order, OrderStatus } from '../order/order.entity';
import { Inventory, InventoryType, InventorySource } from '../inventory/inventory.entity';
import { AfterSale } from '../aftersale/aftersale.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

const TEST_SKU = 'TEST-SKU-001';
const TEST_PRODUCT = '测试商品A';
const INIT_STOCK = 100;
const SHIP_QUANTITY = 5;

describe('发货扣库存-幂等性测试（库存口径）', () => {
  let module: TestingModule;
  let shipmentService: ShipmentService;
  let orderService: OrderService;
  let inventoryService: InventoryService;
  let inventoryRepo: Repository<Inventory>;
  let orderRepo: Repository<Order>;
  let shipmentRepo: Repository<Shipment>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Order, Shipment, Inventory, AfterSale],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Order, Shipment, Inventory, AfterSale]),
      ],
      providers: [ShipmentService, OrderService, InventoryService],
    }).compile();

    shipmentService = module.get<ShipmentService>(ShipmentService);
    orderService = module.get<OrderService>(OrderService);
    inventoryService = module.get<InventoryService>(InventoryService);
    inventoryRepo = module.get<Repository<Inventory>>(getRepositoryToken(Inventory));
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
    shipmentRepo = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await inventoryRepo.clear();
    await shipmentRepo.clear();
    await orderRepo.clear();

    await inventoryService.create({
      sku: TEST_SKU,
      productName: TEST_PRODUCT,
      quantity: INIT_STOCK,
      type: InventoryType.IN,
      source: InventorySource.PURCHASE,
      operator: 'system-init',
      remark: '测试初始库存',
    });

    const stock = await inventoryService.getStockBySku(TEST_SKU);
    expect(stock).toBe(INIT_STOCK);
  });

  const createOrder = async (status: OrderStatus = OrderStatus.PAID): Promise<Order> => {
    return orderService.create({
      orderNo: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      customerName: '张三',
      customerPhone: '13800138000',
      address: '北京市朝阳区',
      totalAmount: 99.0,
      status,
      remark: '',
    });
  };

  const buildShipmentDto = (orderId: number, status?: ShipmentStatus): CreateShipmentDto => ({
    shipmentNo: `SHIP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    orderId,
    logisticsCompany: LogisticsCompany.SF,
    trackingNo: `SF${Date.now()}`,
    itemsCount: SHIP_QUANTITY,
    sku: TEST_SKU,
    productName: TEST_PRODUCT,
    quantity: SHIP_QUANTITY,
    status,
    operator: 'tester',
    remark: '',
  });

  const countStockOutRecords = async (shipmentNo: string): Promise<number> => {
    return inventoryRepo.count({
      where: {
        relatedShipmentNo: shipmentNo,
        type: InventoryType.OUT,
        source: InventorySource.SHIPMENT,
      },
    });
  };

  const countStockInRecords = async (shipmentNo: string): Promise<number> => {
    return inventoryRepo.count({
      where: {
        relatedShipmentNo: shipmentNo,
        type: InventoryType.IN,
        source: InventorySource.SHIPMENT,
      },
    });
  };

  describe('ship() 方法幂等性', () => {
    it('【幂等】重复调用 ship()：库存只扣一次，出库流水只产生一条', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);
      expect(shipment.status).toBe(ShipmentStatus.PENDING);

      await shipmentService.ship(shipment.id);
      const stockAfterFirstShip = await inventoryService.getStockBySku(TEST_SKU);
      expect(stockAfterFirstShip).toBe(INIT_STOCK - SHIP_QUANTITY);

      const outCount1 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount1).toBe(1);

      await expect(shipmentService.ship(shipment.id)).rejects.toThrow(BadRequestException);

      const stockAfterSecondShip = await inventoryService.getStockBySku(TEST_SKU);
      expect(stockAfterSecondShip).toBe(INIT_STOCK - SHIP_QUANTITY);

      const outCount2 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount2).toBe(1);
    });

    it('【幂等】已CANCELLED的发货单调用 ship()：拒绝，库存不变', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);
      await shipmentService.cancel(shipment.id);

      const stockBefore = await inventoryService.getStockBySku(TEST_SKU);
      await expect(shipmentService.ship(shipment.id)).rejects.toThrow(BadRequestException);
      const stockAfter = await inventoryService.getStockBySku(TEST_SKU);
      expect(stockAfter).toBe(stockBefore);
      expect(stockAfter).toBe(INIT_STOCK);

      const outCount = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount).toBe(0);
    });
  });

  describe('update() 状态流转幂等性', () => {
    it('【幂等】重复通过 update() 将 PENDING->SHIPPED：库存只扣一次', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);

      const updateDto1: UpdateShipmentDto = { status: ShipmentStatus.SHIPPED };
      await shipmentService.update(shipment.id, updateDto1);
      const stock1 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock1).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount1 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount1).toBe(1);

      const updateDto2: UpdateShipmentDto = { status: ShipmentStatus.SHIPPED };
      await shipmentService.update(shipment.id, updateDto2);
      const stock2 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock2).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount2 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount2).toBe(1);
    });

    it('【幂等】create时即SHIPPED，再update为SHIPPED：库存不重复扣', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id, ShipmentStatus.SHIPPED);
      const shipment = await shipmentService.create(dto);

      const stock1 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock1).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount1 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount1).toBe(1);

      const updateDto: UpdateShipmentDto = { status: ShipmentStatus.SHIPPED };
      await shipmentService.update(shipment.id, updateDto);
      const stock2 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock2).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount2 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount2).toBe(1);
    });

    it('【幂等】ship()后再通过update()设为SHIPPED：库存不重复扣', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);
      await shipmentService.ship(shipment.id);

      const stock1 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock1).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount1 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount1).toBe(1);

      const updateDto: UpdateShipmentDto = { status: ShipmentStatus.SHIPPED };
      await shipmentService.update(shipment.id, updateDto);
      const stock2 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock2).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount2 = await countStockOutRecords(shipment.shipmentNo);
      expect(outCount2).toBe(1);
    });

    it('【口径】SHIPPED->CANCELLED->SHIPPED：出库一条、回库一条、再出库一条，库存净变化扣一次', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);
      const shipmentNo = shipment.shipmentNo;

      await shipmentService.update(shipment.id, { status: ShipmentStatus.SHIPPED });
      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK - SHIP_QUANTITY);
      expect(await countStockOutRecords(shipmentNo)).toBe(1);
      expect(await countStockInRecords(shipmentNo)).toBe(0);

      await shipmentService.cancel(shipment.id);
      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK);
      expect(await countStockOutRecords(shipmentNo)).toBe(1);
      expect(await countStockInRecords(shipmentNo)).toBe(1);

      await shipmentService.update(shipment.id, { status: ShipmentStatus.SHIPPED });
      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK - SHIP_QUANTITY);
      expect(await countStockOutRecords(shipmentNo)).toBe(2);
      expect(await countStockInRecords(shipmentNo)).toBe(1);
    });

    it('【口径】SHIPPED->PENDING->SHIPPED：出库一条、回库一条、再出库一条，库存净变化扣一次', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id, ShipmentStatus.SHIPPED);
      const shipment = await shipmentService.create(dto);
      const shipmentNo = shipment.shipmentNo;

      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK - SHIP_QUANTITY);
      expect(await countStockOutRecords(shipmentNo)).toBe(1);

      await shipmentService.update(shipment.id, { status: ShipmentStatus.PENDING });
      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK);
      expect(await countStockInRecords(shipmentNo)).toBe(1);

      await shipmentService.update(shipment.id, { status: ShipmentStatus.SHIPPED });
      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK - SHIP_QUANTITY);
      expect(await countStockOutRecords(shipmentNo)).toBe(2);
    });
  });

  describe('create() 创建即发货幂等性', () => {
    it('【幂等】同一shipmentNo重复create：数据库唯一约束拒绝，库存只扣一次（或不扣，取决于是否成功）', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id, ShipmentStatus.SHIPPED);
      const shipmentNo = dto.shipmentNo;

      const shipment = await shipmentService.create(dto);
      expect(shipment.shipmentNo).toBe(shipmentNo);
      const stock1 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock1).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount1 = await countStockOutRecords(shipmentNo);
      expect(outCount1).toBe(1);

      const duplicateDto: CreateShipmentDto = { ...dto, orderId: order.id };
      await expect(shipmentService.create(duplicateDto)).rejects.toThrow();

      const stock2 = await inventoryService.getStockBySku(TEST_SKU);
      expect(stock2).toBe(INIT_STOCK - SHIP_QUANTITY);
      const outCount2 = await countStockOutRecords(shipmentNo);
      expect(outCount2).toBe(1);
    });
  });

  describe('并发场景模拟（串行等价验证）', () => {
    it('【并发等价】ship() 后立刻 update SHIPPED：库存扣一次', async () => {
      const order = await createOrder();
      const dto = buildShipmentDto(order.id);
      const shipment = await shipmentService.create(dto);

      await shipmentService.ship(shipment.id);
      await shipmentService.update(shipment.id, { status: ShipmentStatus.SHIPPED });

      expect(await inventoryService.getStockBySku(TEST_SKU)).toBe(INIT_STOCK - SHIP_QUANTITY);
      expect(await countStockOutRecords(shipment.shipmentNo)).toBe(1);
    });
  });
});
