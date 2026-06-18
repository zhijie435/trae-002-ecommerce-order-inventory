import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ShipmentStatus, LogisticsCompany } from '../shipment.entity';

export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  shipmentNo: string;

  @IsNumber()
  orderId: number;

  @IsEnum(LogisticsCompany)
  logisticsCompany: LogisticsCompany;

  @IsString()
  @IsNotEmpty()
  trackingNo: string;

  @IsNumber()
  itemsCount: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsString()
  @IsNotEmpty()
  operator: string;
}
