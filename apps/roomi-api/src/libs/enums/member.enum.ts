import { registerEnumType } from "@nestjs/graphql";

/** * MEMBER TYPE 
 * USER: Oddiy ijarachi yoki uy qidiruvchi
 * AGENT: Ko'chmas mulk agenti yoki rieltor
 * ADMIN: Tizim boshqaruvchisi
 */
export enum MemberType {
    USER = "USER",
    AGENT = "AGENT",
    ADMIN = "ADMIN",
}

registerEnumType(MemberType, {
    name: "MemberType",
    description: "Foydalanuvchi roli: USER (mijoz), AGENT (rieltor), ADMIN (boshqaruvchi)",
});

/** * MEMBER STATUS 
 * ACTIVE: Tizimdan to'liq foydalana oladi
 * BLOCK: Kirish taqiqlangan (vaqtinchalik yoki doimiy)
 * DELETE: Akkaunt o'chirilgan (Soft delete uchun)
 */
export enum MemberStatus {
    ACTIVE = "ACTIVE",
    BLOCK = "BLOCK",
    DELETE = "DELETE",
}

registerEnumType(MemberStatus, {
    name: "MemberStatus",
    description: "Foydalanuvchi holati: ACTIVE, BLOCK yoki DELETE",
});

/** * MEMBER AUTH TYPE 
 * Avtorizatsiya usullari
 */
export enum MemberAuthType {
    PHONE = "PHONE",
    EMAIL = "EMAIL",
    TELEGRAM = "TELEGRAM",
    GOOGLE = "GOOGLE", // ROOMi uchun qo'shimcha qulaylik
}

registerEnumType(MemberAuthType, {
    name: "MemberAuthType",
    description: "Ro'yxatdan o'tish turi: Telefon, Email, Telegram yoki Google",
});