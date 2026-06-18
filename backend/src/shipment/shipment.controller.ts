import { Controller, Get, Post, Body, Put, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment, ShipmentStatus } from './shipment.entity';

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    return this.shipmentService.create(createShipmentDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('status') status?: ShipmentStatus,
  ): Promise<{ data: Shipment[]; total: number }> {
    return this.shipmentService.findAll(parseInt(page), parseInt(pageSize), status);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Shipment> {
    return this.shipmentService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShipmentDto: UpdateShipmentDto): Promise<Shipment> {
    return this.shipmentService.update(+id, updateShipmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.shipmentService.remove(+id);
  }

  @Post(':id/ship')
  ship(@Param('id') id: string): Promise<Shipment> {
    return this.shipmentService.ship(+id);
  }

  @Post(':id/deliver')
  deliver(@Param('id') id: string): Promise<Shipment> {
    return this.shipmentService.deliver(+id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string): Promise<Shipment> {
    return this.shipmentService.cancel(+id);
  }
}
