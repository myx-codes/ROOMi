import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingService } from './rating.service';
import RatingSchema from '../../schemas/Rating.model';
import PropertySchema from '../../schemas/Property.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: 'Rating',
                schema: RatingSchema,
            },
            {
                name: 'Property',
                schema: PropertySchema,
            },
        ]),
    ],
    providers: [RatingService],
    exports: [RatingService],
})
export class RatingModule {}
