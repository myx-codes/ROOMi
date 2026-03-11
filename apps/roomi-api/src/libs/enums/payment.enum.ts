import { registerEnumType } from '@nestjs/graphql';

export enum PaymentStatus {
    PENDING = 'PENDING',   // To'lov kutilmoqda
    SUCCESS = 'SUCCESS',   // To'lov muvaffaqiyatli amalga oshirildi
    FAILED = 'FAILED',     // To'lovda xatolik yuz berdi
    REFUNDED = 'REFUNDED', // Pul mijozga qaytarib berildi (masalan, bron bekor qilinganda)
}

registerEnumType(PaymentStatus, {
    name: 'PaymentStatus',
    description: 'Toʻlov tranzaksiyasining holati',
});

export enum PaymentMethod {
    CLICK = 'CLICK',
    PAYME = 'PAYME',
    UZUM = 'UZUM',
    CASH = 'CASH',     // Joyida naqd to'lash (agar ruxsat berilsa)
    WALLET = 'WALLET', // Foydalanuvchining ichki hamyoni (balansi)
}

registerEnumType(PaymentMethod, {
    name: 'PaymentMethod',
    description: 'Toʻlov turlari',
});