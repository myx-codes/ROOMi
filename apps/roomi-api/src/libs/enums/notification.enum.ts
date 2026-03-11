import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
    FAQ = 'FAQ',             // Ko'p beriladigan savollar
    TERMS = 'TERMS',         // Foydalanish shartlari
    PRIVACY = 'PRIVACY',     // Maxfiylik siyosati (Yangi qo'shildi)
    INQUIRY = 'INQUIRY',     // Foydalanuvchi murojaatlari / So'rovnomalar
    ANNOUNCEMENT = 'ANNOUNCEMENT' // Muhim e'lonlar (masalan: "Tizimda profilaktika")
}

registerEnumType(NoticeCategory, {
    name: 'NoticeCategory',
    description: 'Platformadagi bildirishnoma va hujjatlar turlari',
});

export enum NoticeStatus {
    HOLD = 'HOLD',     // Qoralama (hali chop etilmagan)
    ACTIVE = 'ACTIVE', // Saytda ko'rinib turibdi
    DELETE = 'DELETE', // O'chirilgan
}

registerEnumType(NoticeStatus, {
    name: 'NoticeStatus',
    description: 'Bildirishnoma holatlari',
});