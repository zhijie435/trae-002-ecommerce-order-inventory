import { PartialType } from '@nestjs/mapped-types';
import { CreateAfterSaleDto } from './create-aftersale.dto';

export class UpdateAfterSaleDto extends PartialType(CreateAfterSaleDto) {}
