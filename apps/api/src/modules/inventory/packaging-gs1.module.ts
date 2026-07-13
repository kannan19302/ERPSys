import { Module } from '@nestjs/common';
import { PackagingGs1Controller } from './packaging-gs1.controller';
import { PackagingGs1Service } from './packaging-gs1.service';

@Module({
  controllers: [PackagingGs1Controller],
  providers: [PackagingGs1Service],
  exports: [PackagingGs1Service],
})
export class PackagingGs1Module {}
