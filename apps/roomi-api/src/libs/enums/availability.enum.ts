import { registerEnumType } from '@nestjs/graphql';

export enum AvailabilityStatus {
    AVAILABLE = 'AVAILABLE', // Obyekt ushbu sanada bo'sh
    OCCUPIED = 'OCCUPIED',   // Obyekt band (bron qilingan)
    MAINTENANCE = 'MAINTENANCE', // Ta'mirlash yoki profilaktika (egasi tomonidan yopib qo'yilgan)
}

registerEnumType(AvailabilityStatus, {
    name: 'AvailabilityStatus',
    description: 'Obyektning maʼlum bir sanadagi holati',
});