import { DecodedUser } from '../../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}