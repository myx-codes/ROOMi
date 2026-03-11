import { registerEnumType } from '@nestjs/graphql';

export enum CommentStatus {
    HOLD = 'HOLD',     // Izoh tekshiruvda (Moderatsiya kutmoqda)
    ACTIVE = 'ACTIVE', // Saytda hamma ko'ra oladi
    DELETE = 'DELETE', // O'chirilgan
}

registerEnumType(CommentStatus, {
    name: 'CommentStatus',
    description: 'Izohlarning hayotiy sikli (Moderatsiya qoʻshilgan)',
});

export enum CommentGroup {
    MEMBER = 'MEMBER',     // Foydalanuvchi profiliga yozilgan izoh
    ARTICLE = 'ARTICLE',   // Maqola/Blog postga yozilgan izoh
    PROPERTY = 'PROPERTY', // Dacha, Hotel yoki Uyga yozilgan izoh (Review)
}

registerEnumType(CommentGroup, {
    name: 'CommentGroup',
    description: 'Izoh qaysi turdagi obyektga tegishli ekanligi',
});