import { User, Vendor } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: User;
            vendor?: Vendor;
        }
    }
}
