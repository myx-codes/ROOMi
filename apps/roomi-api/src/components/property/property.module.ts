import { Module } from '@nestjs/common';
import { PropertyResolver } from './property.resolver';
import { PropertyService } from './property.service';

@Module({
  providers: [PropertyResolver, PropertyService]
})
export class PropertyModule {}
