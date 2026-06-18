import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { InventoryType, InventorySource } from '../inventory.entity';

export class CreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  quantity: number;

  @IsEnum(InventoryType)
  type: InventoryType;

  @IsEnum(InventorySource)
  source: InventorySource;

  @IsOptional()
  @IsString()
  relatedOrderNo?: string;

  @IsOptional()
  @IsString()
  relatedShipmentNo?: string;

  @IsOptional()
  @IsString()
  relatedAfterSaleNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsString()
  @IsNotEmpty()
  operator: string;
}
