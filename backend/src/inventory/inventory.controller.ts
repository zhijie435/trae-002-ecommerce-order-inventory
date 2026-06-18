import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { Inventory, InventoryType, InventorySource } from './inventory.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('sku') sku?: string,
    @Query('type') type?: InventoryType,
    @Query('source') source?: InventorySource,
    @Query('relatedOrderNo') relatedOrderNo?: string,
    @Query('relatedShipmentNo') relatedShipmentNo?: string,
    @Query('relatedAfterSaleNo') relatedAfterSaleNo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ data: Inventory[]; total: number }> {
    return this.inventoryService.findAll(
      parseInt(page),
      parseInt(pageSize),
      sku,
      type,
      source,
      relatedOrderNo,
      relatedShipmentNo,
      relatedAfterSaleNo,
      startDate,
      endDate,
    );
  }

  @Get('history/:sku')
  getHistoryBySku(
    @Param('sku') sku: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ): Promise<{ data: Inventory[]; total: number; currentStock: number }> {
    return this.inventoryService.getHistoryBySku(sku, parseInt(page), parseInt(pageSize));
  }

  @Get('summary')
  getStockSummary(): Promise<{ sku: string; productName: string; stock: number }[]> {
    return this.inventoryService.getAllStockSummary();
  }

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold: string = '10'): Promise<{ sku: string; productName: string; stock: number }[]> {
    return this.inventoryService.getLowStock(parseInt(threshold));
  }

  @Get('sku/:sku')
  getStockBySku(@Param('sku') sku: string): Promise<number> {
    return this.inventoryService.getStockBySku(sku);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Inventory> {
    return this.inventoryService.findOne(+id);
  }
}
