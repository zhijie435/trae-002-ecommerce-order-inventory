import { Controller, Get, Post, Body, Put, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AfterSaleService } from './aftersale.service';
import { CreateAfterSaleDto } from './dto/create-aftersale.dto';
import { UpdateAfterSaleDto } from './dto/update-aftersale.dto';
import { AfterSale, AfterSaleStatus, AfterSaleType } from './aftersale.entity';

@Controller('aftersales')
export class AfterSaleController {
  constructor(private readonly afterSaleService: AfterSaleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAfterSaleDto: CreateAfterSaleDto): Promise<AfterSale> {
    return this.afterSaleService.create(createAfterSaleDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('status') status?: AfterSaleStatus,
    @Query('type') type?: AfterSaleType,
  ): Promise<{ data: AfterSale[]; total: number }> {
    return this.afterSaleService.findAll(parseInt(page), parseInt(pageSize), status, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AfterSale> {
    return this.afterSaleService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAfterSaleDto: UpdateAfterSaleDto): Promise<AfterSale> {
    return this.afterSaleService.update(+id, updateAfterSaleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.afterSaleService.remove(+id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string): Promise<AfterSale> {
    return this.afterSaleService.approve(+id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('rejectReason') rejectReason: string): Promise<AfterSale> {
    return this.afterSaleService.reject(+id, rejectReason);
  }

  @Post(':id/process-return')
  processReturn(@Param('id') id: string): Promise<AfterSale> {
    return this.afterSaleService.processReturn(+id);
  }

  @Post(':id/process-exchange')
  processExchange(
    @Param('id') id: string,
    @Body('newShipmentNo') newShipmentNo: string,
  ): Promise<AfterSale> {
    return this.afterSaleService.processExchange(+id, newShipmentNo);
  }

  @Post(':id/process-refund')
  processRefund(@Param('id') id: string): Promise<AfterSale> {
    return this.afterSaleService.processRefund(+id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string): Promise<AfterSale> {
    return this.afterSaleService.cancel(+id);
  }
}
