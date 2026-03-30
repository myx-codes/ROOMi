import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type AbaiSearch = {
  articleCategory?: InputMaybe<BoardArticleCategory>;
  articleStatus?: InputMaybe<BoardArticleStatus>;
};

export type AiSearch = {
  text?: InputMaybe<Scalars['String']['input']>;
};

export type AlpiSearch = {
  propertyLocationList?: InputMaybe<Array<PropertyLocation>>;
  propertyStatus?: InputMaybe<PropertyStatus>;
};

export type ApiSearch = {
  propertyStatus?: InputMaybe<PropertyStatus>;
};

export type AgentPropertiesInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: ApiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type AgentsInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: AiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type AllBoardArticlesInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: AbaiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type AllPropertiesInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: AlpiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type Availability = {
  __typename?: 'Availability';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['String']['output'];
  isBooked: Scalars['Boolean']['output'];
  memberId: Scalars['ID']['output'];
  propertyId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AvailabilityInput = {
  date: Scalars['String']['input'];
  isBooked: Scalars['Boolean']['input'];
  propertyId: Scalars['ID']['input'];
};

export type BaiSearch = {
  articleCategory?: InputMaybe<BoardArticleCategory>;
  memberId?: InputMaybe<Scalars['ID']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type BoardArticle = {
  __typename?: 'BoardArticle';
  _id: Scalars['ID']['output'];
  articleCategory: BoardArticleCategory;
  articleComments: Scalars['Int']['output'];
  articleContent: Scalars['String']['output'];
  articleImage?: Maybe<Scalars['String']['output']>;
  articleLikes: Scalars['Int']['output'];
  articleStatus: BoardArticleStatus;
  articleTitle: Scalars['String']['output'];
  articleViews: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  meLiked?: Maybe<Array<MeLiked>>;
  memberData?: Maybe<Member>;
  memberId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** ROOMi platformasidagi maqolalar kategoriyalari */
export enum BoardArticleCategory {
  Event = 'EVENT',
  Free = 'FREE',
  Help = 'HELP',
  Lifestyle = 'LIFESTYLE',
  News = 'NEWS',
  Recommend = 'RECOMMEND'
}

export type BoardArticleInput = {
  articleCategory: BoardArticleCategory;
  articleContent: Scalars['String']['input'];
  articleImage?: InputMaybe<Scalars['String']['input']>;
  articleTitle: Scalars['String']['input'];
};

/** Maqolalarning holati */
export enum BoardArticleStatus {
  Active = 'ACTIVE',
  Delete = 'DELETE',
  Waiting = 'WAITING'
}

export type BoardArticleUpdate = {
  _id: Scalars['ID']['input'];
  articleContent?: InputMaybe<Scalars['String']['input']>;
  articleImage?: InputMaybe<Scalars['String']['input']>;
  articleStatus?: InputMaybe<BoardArticleStatus>;
  articleTitle?: InputMaybe<Scalars['String']['input']>;
};

export type BoardArticles = {
  __typename?: 'BoardArticles';
  list: Array<BoardArticle>;
  metaCounter?: Maybe<Array<TotalCounter>>;
};

export type BoardArticlesInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: BaiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type Booking = {
  __typename?: 'Booking';
  _id: Scalars['ID']['output'];
  /** Check-in sanasi: YYYY-MM-DD */
  bookingCheckIn: Scalars['String']['output'];
  /** Check-out sanasi: YYYY-MM-DD */
  bookingCheckOut: Scalars['String']['output'];
  bookingEnd: Scalars['DateTime']['output'];
  bookingGuests: Scalars['Int']['output'];
  /** Alias for totalPrice */
  bookingPrice: Scalars['Int']['output'];
  bookingStart: Scalars['DateTime']['output'];
  bookingStatus: BookingStatus;
  createdAt: Scalars['DateTime']['output'];
  memberData?: Maybe<Member>;
  memberId: Scalars['ID']['output'];
  propertyData?: Maybe<Property>;
  propertyId: Scalars['ID']['output'];
  totalPrice: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type BookingInput = {
  /** Check-out sana: YYYY-MM-DD */
  bookingEnd: Scalars['String']['input'];
  bookingGuests: Scalars['Int']['input'];
  /** Check-in sana: YYYY-MM-DD */
  bookingStart: Scalars['String']['input'];
  propertyId: Scalars['ID']['input'];
  totalPrice?: InputMaybe<Scalars['Int']['input']>;
};

/** Bron qilish holatlari */
export enum BookingStatus {
  Cancelled = 'CANCELLED',
  Confirmed = 'CONFIRMED',
  Finished = 'FINISHED',
  Waiting = 'WAITING'
}

export type Bookings = {
  __typename?: 'Bookings';
  list: Array<Booking>;
  metaCounter?: Maybe<Array<TotalCounter>>;
};

export type BookingsInquiry = {
  bookingStatus?: InputMaybe<BookingStatus>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};

export type CiSearch = {
  commentRefId: Scalars['ID']['input'];
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['ID']['output'];
  commentContent: Scalars['String']['output'];
  commentGroup: CommentGroup;
  commentRefId: Scalars['ID']['output'];
  commentStatus: CommentStatus;
  createdAt: Scalars['DateTime']['output'];
  memberData?: Maybe<Member>;
  memberId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Izoh qaysi turdagi obyektga tegishli ekanligi */
export enum CommentGroup {
  Article = 'ARTICLE',
  Member = 'MEMBER',
  Property = 'PROPERTY'
}

export type CommentInput = {
  commentContent: Scalars['String']['input'];
  commentGroup: CommentGroup;
  commentRefId: Scalars['ID']['input'];
};

/** Izohlarning hayotiy sikli (Moderatsiya qoʻshilgan) */
export enum CommentStatus {
  Active = 'ACTIVE',
  Delete = 'DELETE',
  Hold = 'HOLD'
}

export type CommentUpdate = {
  _id: Scalars['ID']['input'];
  commentContent?: InputMaybe<Scalars['String']['input']>;
  commentStatus?: InputMaybe<CommentStatus>;
};

export type Comments = {
  __typename?: 'Comments';
  list: Array<Comment>;
  metaCounter?: Maybe<Array<TotalCounter>>;
};

export type CommentsInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: CiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

/** Saralash yo'nalishi: ASC (1) yoki DESC (-1) */
export enum Direction {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type LoginInput = {
  memberNick: Scalars['String']['input'];
  memberPassword: Scalars['String']['input'];
};

export type MiSearch = {
  memberStatus?: InputMaybe<MemberStatus>;
  memberType?: InputMaybe<MemberType>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type MeLiked = {
  __typename?: 'MeLiked';
  likeRefId: Scalars['ID']['output'];
  memberId: Scalars['ID']['output'];
  myFavorite: Scalars['Boolean']['output'];
};

export type Member = {
  __typename?: 'Member';
  _id: Scalars['ID']['output'];
  accessToken?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  meLiked?: Maybe<Array<MeLiked>>;
  memberArticles: Scalars['Int']['output'];
  memberAuthType: MemberAuthType;
  memberBlocks: Scalars['Int']['output'];
  memberComments: Scalars['Int']['output'];
  memberFullName?: Maybe<Scalars['String']['output']>;
  memberImage?: Maybe<Scalars['String']['output']>;
  memberLikes: Scalars['Int']['output'];
  memberNick: Scalars['String']['output'];
  memberPhone: Scalars['String']['output'];
  memberPoints: Scalars['Int']['output'];
  memberProperties: Scalars['Int']['output'];
  memberRank: Scalars['Int']['output'];
  memberStatus: MemberStatus;
  memberType: MemberType;
  memberViews: Scalars['Int']['output'];
  memberWarnings: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Ro'yxatdan o'tish turi: Telefon, Email, Telegram yoki Google */
export enum MemberAuthType {
  Email = 'EMAIL',
  Google = 'GOOGLE',
  Phone = 'PHONE',
  Telegram = 'TELEGRAM'
}

export type MemberInput = {
  memberAuthType?: InputMaybe<MemberAuthType>;
  memberFullName?: InputMaybe<Scalars['String']['input']>;
  memberImage?: InputMaybe<Scalars['String']['input']>;
  memberNick: Scalars['String']['input'];
  memberPassword: Scalars['String']['input'];
  memberPhone: Scalars['String']['input'];
  memberType?: InputMaybe<MemberType>;
};

/** Foydalanuvchi holati: ACTIVE, BLOCK yoki DELETE */
export enum MemberStatus {
  Active = 'ACTIVE',
  Block = 'BLOCK',
  Delete = 'DELETE'
}

/** Foydalanuvchi roli: USER (mijoz), AGENT (rieltor), ADMIN (boshqaruvchi) */
export enum MemberType {
  Admin = 'ADMIN',
  Agent = 'AGENT',
  User = 'USER'
}

export type MemberUpdate = {
  _id: Scalars['String']['input'];
  deletedAt?: InputMaybe<Scalars['DateTime']['input']>;
  memberFullName?: InputMaybe<Scalars['String']['input']>;
  memberImage?: InputMaybe<Scalars['String']['input']>;
  memberNick?: InputMaybe<Scalars['String']['input']>;
  memberPassword?: InputMaybe<Scalars['String']['input']>;
  memberPhone?: InputMaybe<Scalars['String']['input']>;
  memberStatus?: InputMaybe<MemberStatus>;
  memberType?: InputMaybe<MemberType>;
};

export type Members = {
  __typename?: 'Members';
  list: Array<Member>;
  metaCounter?: Maybe<Array<TotalCounter>>;
};

export type MembersInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: MiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addMember: Scalars['String']['output'];
  checkout: Payment;
  createBoardArticle: BoardArticle;
  createBooking: Booking;
  createComment: Comment;
  createProperty: Property;
  imageUploader: Scalars['String']['output'];
  imagesUploader: Array<Scalars['String']['output']>;
  likeTargetBoardArticle: BoardArticle;
  likeTargetMember: Member;
  login: Member;
  removeBoardArticleByAdmin: BoardArticle;
  removeCommentByAdmin: Comment;
  removePropertyByAdmin: Property;
  signup: Member;
  updateAvailability?: Maybe<Availability>;
  updateBoardArticle: BoardArticle;
  updateBoardArticleByAdmin: BoardArticle;
  updateComment: Comment;
  updateMember: Member;
  updateMembersByAdmin: Member;
  updateNotificationStatus: Notice;
  updateProperty: Property;
  updatePropertyByAdmin: Property;
};


export type MutationCheckoutArgs = {
  bookingId: Scalars['String']['input'];
  paymentMethod?: InputMaybe<PaymentMethod>;
};


export type MutationCreateBoardArticleArgs = {
  input: BoardArticleInput;
};


export type MutationCreateBookingArgs = {
  input: BookingInput;
};


export type MutationCreateCommentArgs = {
  input: CommentInput;
};


export type MutationCreatePropertyArgs = {
  input: PropertyInput;
};


export type MutationImageUploaderArgs = {
  file: Scalars['Upload']['input'];
  target: Scalars['String']['input'];
};


export type MutationImagesUploaderArgs = {
  files: Array<Scalars['Upload']['input']>;
  target: Scalars['String']['input'];
};


export type MutationLikeTargetBoardArticleArgs = {
  articleId: Scalars['String']['input'];
};


export type MutationLikeTargetMemberArgs = {
  memberId: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRemoveBoardArticleByAdminArgs = {
  articleId: Scalars['String']['input'];
};


export type MutationRemoveCommentByAdminArgs = {
  commentId: Scalars['String']['input'];
};


export type MutationRemovePropertyByAdminArgs = {
  propertyId: Scalars['String']['input'];
};


export type MutationSignupArgs = {
  input: MemberInput;
};


export type MutationUpdateAvailabilityArgs = {
  input: AvailabilityInput;
};


export type MutationUpdateBoardArticleArgs = {
  input: BoardArticleUpdate;
};


export type MutationUpdateBoardArticleByAdminArgs = {
  input: BoardArticleUpdate;
};


export type MutationUpdateCommentArgs = {
  input: CommentUpdate;
};


export type MutationUpdateMemberArgs = {
  input: MemberUpdate;
};


export type MutationUpdateMembersByAdminArgs = {
  input: MemberUpdate;
};


export type MutationUpdateNotificationStatusArgs = {
  notificationId: Scalars['String']['input'];
};


export type MutationUpdatePropertyArgs = {
  input: PropertyUpdate;
};


export type MutationUpdatePropertyByAdminArgs = {
  input: PropertyUpdate;
};

export type Notice = {
  __typename?: 'Notice';
  _id: Scalars['ID']['output'];
  category: NoticeCategory;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  creatorId?: Maybe<Scalars['ID']['output']>;
  propertyId?: Maybe<Scalars['ID']['output']>;
  receiverId: Scalars['ID']['output'];
  status: NoticeStatus;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Platformadagi bildirishnoma va hujjatlar turlari */
export enum NoticeCategory {
  Announcement = 'ANNOUNCEMENT',
  Booking = 'BOOKING',
  Faq = 'FAQ',
  Inquiry = 'INQUIRY',
  Payment = 'PAYMENT',
  Privacy = 'PRIVACY',
  Property = 'PROPERTY',
  Terms = 'TERMS'
}

/** Bildirishnoma holatlari */
export enum NoticeStatus {
  Active = 'ACTIVE',
  Delete = 'DELETE',
  Hold = 'HOLD',
  Read = 'READ',
  Unread = 'UNREAD'
}

export type OrdinaryInquiry = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};

export type PiSearch = {
  bedsList?: InputMaybe<Array<Scalars['Int']['input']>>;
  locationList?: InputMaybe<Array<PropertyLocation>>;
  memberId?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  periodsRange?: InputMaybe<PeriodsRange>;
  pricesRange?: InputMaybe<PricesRange>;
  roomsList?: InputMaybe<Array<Scalars['Int']['input']>>;
  squaresRange?: InputMaybe<SquaresRange>;
  text?: InputMaybe<Scalars['String']['input']>;
  typeList?: InputMaybe<Array<PropertyType>>;
};

export type Payment = {
  __typename?: 'Payment';
  _id: Scalars['ID']['output'];
  bookingId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  memberId: Scalars['ID']['output'];
  paidAt?: Maybe<Scalars['DateTime']['output']>;
  paymentAmount: Scalars['Int']['output'];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Toʻlov turlari */
export enum PaymentMethod {
  Cash = 'CASH',
  Click = 'CLICK',
  Payme = 'PAYME',
  Uzum = 'UZUM',
  Wallet = 'WALLET'
}

/** Toʻlov tranzaksiyasining holati */
export enum PaymentStatus {
  Failed = 'FAILED',
  Pending = 'PENDING',
  Refunded = 'REFUNDED',
  Success = 'SUCCESS'
}

export type PeriodsRange = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
};

export type PricesRange = {
  end: Scalars['Int']['input'];
  start: Scalars['Int']['input'];
};

export type Properties = {
  __typename?: 'Properties';
  list: Array<Property>;
  metaCounter?: Maybe<Array<TotalCounter>>;
};

export type PropertiesInquiry = {
  direction?: InputMaybe<Direction>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search: PiSearch;
  sort?: InputMaybe<Scalars['String']['input']>;
};

export type Property = {
  __typename?: 'Property';
  _id: Scalars['ID']['output'];
  constructedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  meLiked?: Maybe<Array<MeLiked>>;
  memberData?: Maybe<Member>;
  memberId: Scalars['ID']['output'];
  propertyAddress: Scalars['String']['output'];
  propertyBeds: Scalars['Int']['output'];
  propertyComments: Scalars['Int']['output'];
  propertyDesc?: Maybe<Scalars['String']['output']>;
  propertyImages: Array<Scalars['String']['output']>;
  propertyLikes: Scalars['Int']['output'];
  propertyLocation: PropertyLocation;
  propertyPrice: Scalars['Float']['output'];
  propertyRank: Scalars['Int']['output'];
  propertyRent: Scalars['Boolean']['output'];
  propertyRooms: Scalars['Int']['output'];
  propertySquare: Scalars['Float']['output'];
  propertyStatus: PropertyStatus;
  propertyTitle: Scalars['String']['output'];
  propertyType: PropertyType;
  propertyViews: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PropertyInput = {
  constructedAt?: InputMaybe<Scalars['DateTime']['input']>;
  propertyAddress: Scalars['String']['input'];
  propertyBeds: Scalars['Int']['input'];
  propertyDesc?: InputMaybe<Scalars['String']['input']>;
  propertyImages: Array<Scalars['String']['input']>;
  propertyLocation: PropertyLocation;
  propertyPrice: Scalars['Float']['input'];
  propertyRent?: InputMaybe<Scalars['Boolean']['input']>;
  propertyRooms: Scalars['Int']['input'];
  propertySquare: Scalars['Float']['input'];
  propertyTitle: Scalars['String']['input'];
  propertyType: PropertyType;
};

export enum PropertyLocation {
  Bostonliq = 'BOSTONLIQ',
  Bukhara = 'BUKHARA',
  Busan = 'BUSAN',
  Chimgan = 'CHIMGAN',
  Chodak = 'CHODAK',
  Chonju = 'CHONJU',
  Chorvoq = 'CHORVOQ',
  Daegu = 'DAEGU',
  Daejon = 'DAEJON',
  Gwangju = 'GWANGJU',
  Gyeongju = 'GYEONGJU',
  Incheon = 'INCHEON',
  Jeju = 'JEJU',
  Khiva = 'KHIVA',
  Samarkand = 'SAMARKAND',
  Seoul = 'SEOUL',
  Tashkent = 'TASHKENT',
  Zaamin = 'ZAAMIN'
}

export enum PropertyStatus {
  Active = 'ACTIVE',
  Booked = 'BOOKED',
  Delete = 'DELETE',
  Hold = 'HOLD'
}

export enum PropertyType {
  Apartment = 'APARTMENT',
  Hotel = 'HOTEL',
  Resort = 'RESORT',
  Villa = 'VILLA'
}

export type PropertyUpdate = {
  _id: Scalars['ID']['input'];
  constructedAt?: InputMaybe<Scalars['DateTime']['input']>;
  propertyAddress?: InputMaybe<Scalars['String']['input']>;
  propertyBeds?: InputMaybe<Scalars['Int']['input']>;
  propertyDesc?: InputMaybe<Scalars['String']['input']>;
  propertyImages?: InputMaybe<Array<Scalars['String']['input']>>;
  propertyLocation?: InputMaybe<PropertyLocation>;
  propertyPrice?: InputMaybe<Scalars['Float']['input']>;
  propertyRent?: InputMaybe<Scalars['Boolean']['input']>;
  propertyRooms?: InputMaybe<Scalars['Int']['input']>;
  propertySquare?: InputMaybe<Scalars['Float']['input']>;
  propertyStatus?: InputMaybe<PropertyStatus>;
  propertyTitle?: InputMaybe<Scalars['String']['input']>;
  propertyType?: InputMaybe<PropertyType>;
};

export type Query = {
  __typename?: 'Query';
  checkAuth: Scalars['String']['output'];
  checkAuthRoles: Scalars['String']['output'];
  getAgentProperties: Properties;
  getAgents: Members;
  getAllBoardArticlesByAdmin: BoardArticles;
  getAllMembersByAdmin: Members;
  getAllPropertiesByAdmin: Properties;
  getBoardArticle: BoardArticle;
  getBoardArticles: BoardArticles;
  getComments: Comments;
  getFavorites: Properties;
  getMember: Member;
  getMyBookings: Bookings;
  getMyNotifications: Array<Notice>;
  getProperties: Properties;
  getProperty: Property;
  getPropertyAvailability: Array<Availability>;
  getVisited: Properties;
  healthCheck: Scalars['String']['output'];
  introduce: Scalars['String']['output'];
};


export type QueryGetAgentPropertiesArgs = {
  input: AgentPropertiesInquiry;
};


export type QueryGetAgentsArgs = {
  input: AgentsInquiry;
};


export type QueryGetAllBoardArticlesByAdminArgs = {
  input: AllBoardArticlesInquiry;
};


export type QueryGetAllMembersByAdminArgs = {
  input: MembersInquiry;
};


export type QueryGetAllPropertiesByAdminArgs = {
  input: AllPropertiesInquiry;
};


export type QueryGetBoardArticleArgs = {
  articleId: Scalars['String']['input'];
};


export type QueryGetBoardArticlesArgs = {
  input: BoardArticlesInquiry;
};


export type QueryGetCommentsArgs = {
  input: CommentsInquiry;
};


export type QueryGetFavoritesArgs = {
  input: OrdinaryInquiry;
};


export type QueryGetMemberArgs = {
  memberId: Scalars['String']['input'];
};


export type QueryGetMyBookingsArgs = {
  input: BookingsInquiry;
};


export type QueryGetPropertiesArgs = {
  input: PropertiesInquiry;
};


export type QueryGetPropertyArgs = {
  propertyId: Scalars['String']['input'];
};


export type QueryGetPropertyAvailabilityArgs = {
  propertyId: Scalars['String']['input'];
};


export type QueryGetVisitedArgs = {
  input: OrdinaryInquiry;
};

export type SquaresRange = {
  end: Scalars['Int']['input'];
  start: Scalars['Int']['input'];
};

export type TotalCounter = {
  __typename?: 'TotalCounter';
  total?: Maybe<Scalars['Int']['output']>;
};
