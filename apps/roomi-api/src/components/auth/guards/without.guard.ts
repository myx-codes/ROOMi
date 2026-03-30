import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { getTokenFromRequest } from '../auth-cookie.util';

// RETRIEVER GUARD 
@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext | any): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.contextType === 'graphql') {
			const request = context.getArgByIndex(2).req;
			const { token } = getTokenFromRequest(request);

			if (token) {
				try {
					const authMember = await this.authService.verifyToken(token);
					request.body.authMember = authMember;
				} catch (err) {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			console.log('memberNick[without] =>', request.body.authMember?.memberNick ?? 'none');
			return true;
		}
		return true;

		// description => http, rpc, gprs and etc are ignored
	}
}
