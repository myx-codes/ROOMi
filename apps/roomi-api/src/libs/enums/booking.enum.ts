import { registerEnumType } from '@nestjs/graphql';

export enum BookingStatus {
    WAITING = 'WAITING',   // To'lov yoki Owner tasdig'ini kutmoqda
    CONFIRMED = 'CONFIRMED', // Tasdiqlangan (To'langan yoki band qilingan)
    CANCELLED = 'CANCELLED', // Bekor qilingan
    FINISHED = 'FINISHED',   // Mijoz kelib ketgan (Arxiv)
}

registerEnumType(BookingStatus, {
    name: 'BookingStatus',
    description: 'Bron qilish holatlari',
});

export enum BookingGroup {
    PROPERTY = 'PROPERTY', // Hozircha faqat obyektlar uchun, lekin kelajakda boshqa xizmatlar qo'shilishi mumkin
}

registerEnumType(BookingGroup, {
    name: 'BookingGroup',
});