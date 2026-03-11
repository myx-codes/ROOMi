import { Schema } from 'mongoose';
import { PropertyLocation, PropertyStatus, PropertyType } from '../libs/enums/property.enum';

const PropertySchema = new Schema(
    {
        propertyType: {
            type: String,
            enum: PropertyType,
            required: true,
        },

        propertyStatus: {
            type: String,
            enum: PropertyStatus,
            default: PropertyStatus.ACTIVE,
        },

        propertyLocation: {
            type: String,
            enum: PropertyLocation,
            required: true,
        },

        propertyAddress: {
            type: String,
            required: true,
        },

        propertyTitle: {
            type: String,
            required: true,
            index: true, // Sarlavha bo'yicha qidiruv uchun
        },

        propertyPrice: {
            type: Number,
            required: true,
        },

        propertySquare: {
            type: Number,
            required: true,
        },

        propertyBeds: {
            type: Number,
            required: true,
        },

        propertyRooms: {
            type: Number,
            required: true,
        },

        // ROOMi uchun qo'shimchalar:
        propertyAmenities: {
            type: [String], // ['POOL', 'WIFI', 'SAUNA', 'BBQ']
            default: [],
        },

        // Xaritada ko'rsatish uchun (GeoJSON format)
        propertyCoordinates: {
            lat: { type: Number },
            lng: { type: Number },
        },

        propertyViews: {
            type: Number,
            default: 0,
        },

        propertyLikes: {
            type: Number,
            default: 0,
        },

        propertyComments: {
            type: Number,
            default: 0,
        },

        propertyRank: {
            type: Number, // O'rtacha reyting (Yulduzchalar)
            default: 0,
        },

        propertyImages: {
            type: [String],
            required: true,
        },

        propertyDesc: {
            type: String,
        },

        propertyBarter: {
            type: Boolean,
            default: false,
        },

        propertyRent: {
            type: Boolean,
            default: false,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        soldAt: {
            type: Date,
        },

        deletedAt: {
            type: Date,
        },

        constructedAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'properties' },
);

// Qidiruv filtrlarini optimallashtirish uchun indekslar
PropertySchema.index({ propertyType: 1, propertyLocation: 1, propertyPrice: 1 });
PropertySchema.index({ propertyTitle: 'text', propertyDesc: 'text' }); // Matnli qidiruv uchun

export default PropertySchema;