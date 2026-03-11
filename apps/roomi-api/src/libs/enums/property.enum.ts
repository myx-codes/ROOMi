import { registerEnumType } from '@nestjs/graphql';

// --- Property Type ---
export enum PropertyType {
    VILLA = 'VILLA',
    APARTMENT = 'APARTMENT',
    RESORT = 'RESORT',
    HOTEL = 'HOTEL',
}
registerEnumType(PropertyType, { name: 'PropertyType' });

// --- Property Status ---
export enum PropertyStatus {
    HOLD = 'HOLD',
    ACTIVE = 'ACTIVE',
    BOOKED = 'BOOKED',
    DELETE = 'DELETE',
}
registerEnumType(PropertyStatus, { name: 'PropertyStatus' });

// --- Property Location ---
export enum PropertyLocation {
    SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
    TASHKENT = 'TASHKENT',
    SAMARKAND = 'SAMARKAND',
    BUKHARA = 'BUKHARA',
    KHIVA = 'KHIVA',
    CHORVOQ = 'CHORVOQ',
    BOSTONLIQ = 'BOSTONLIQ',
    ZAAMIN = 'ZAAMIN',
    CHIMGAN = 'CHIMGAN',
    CHODAK = 'CHODAK'
}
registerEnumType(PropertyLocation, { name: 'PropertyLocation' });