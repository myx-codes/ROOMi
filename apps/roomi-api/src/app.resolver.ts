import { Mutation, Query, Resolver } from "@nestjs/graphql";

@Resolver()
export class AppResolver{
    @Query(() => String)
    public healthCheck(): string {
        return "GraphQL API server"
    };

    @Query(() => String)
    public introduce(): string {
        return "I am GraphQL"
    };

    @Mutation(() => String)
    public addMember(): string {
        return "Yangi a'zo muvaffaqiyatli qo'shildi!";
    }

}