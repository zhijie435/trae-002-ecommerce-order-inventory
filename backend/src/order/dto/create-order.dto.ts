import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
