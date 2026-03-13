import { registerEnumType } from '@nestjs/graphql';

/**
 * NoticeCategory - Bildirishnoma va hujjatlar turlari
 * FAQ, TERMS, PRIVACY - Admin tomonidan boshqariladigan statik hujjatlar
 * ANNOUNCEMENT - Umumiy e'lonlar
 * BOOKING, PAYMENT, PROPERTY - Shaxsiy bildirishnomalar
 */
export enum NoticeCategory {
    FAQ = 'FAQ',
    TERMS = 'TERMS',
    PRIVACY = 'PRIVACY',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    BOOKING = 'BOOKING',      // Yangi bron yoki bron holati o'zgarganda
    PAYMENT = 'PAYMENT',      // To'lov muvaffaqiyatli yoki xato bo'lganda
    PROPERTY = 'PROPERTY',    // Dacha tasdiqlanganda yoki rad etilganda
    INQUIRY = 'INQUIRY',      // Murojaatlarga javob qaytganda
}

registerEnumType(NoticeCategory, {
    name: 'NoticeCategory',
    description: 'Platformadagi bildirishnoma va hujjatlar turlari',
});

/**
 * NoticeStatus - Bildirishnomaning hayotiy sikli
 * READ / UNREAD - Shaxsiy bildirishnomalar uchun
 * ACTIVE / HOLD - Umumiy e'lonlar va hujjatlar uchun
 */
export enum NoticeStatus {
    HOLD = 'HOLD',     // Qoralama (chop etilmagan)
    ACTIVE = 'ACTIVE', // Faol (hamma ko'radi)
    UNREAD = 'UNREAD', // Shaxsiy xabar: O'qilmagan
    READ = 'READ',     // Shaxsiy xabar: O'qilgan
    DELETE = 'DELETE', // O'chirilgan
}

registerEnumType(NoticeStatus, {
    name: 'NoticeStatus',
    description: 'Bildirishnoma holatlari',
});