import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { AfterSaleType, AfterSaleStatus } from '../aftersale.entity';

export class CreateAfterSaleDto {
  @IsString()
  @IsNotEmpty()
  afterSaleNo: string;

  @IsNumber()
  orderId: number;

  @IsEnum(AfterSaleType)
  type: AfterSaleType;

  @IsOptional()
  @IsEnum(AfterSaleStatus)
  status?: AfterSaleStatus;

  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsOptional()
  @IsString()
  returnTrackingNo?: string;

  @IsOptional()
  @IsString()
  exchangeShipmentNo?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

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
  @IsString()
  remark?: string;

  @IsString()
  @IsNotEmpty()
  operator: string;
}
