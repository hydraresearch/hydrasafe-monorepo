import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { SecurityService } from '../../../modules/security/security.service';
import { IUser } from '@hydrasafe/common/src/models/user/user';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let securityService: SecurityService;
  let userModel: any;

  const mockUser = {
    _id: 'mockUserId',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
    securityLevel: 'MEDIUM',
    isActive: true,
    save: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      _id: 'mockUserId',
      email: 'test@example.com',
      role: 'USER',
      securityLevel: 'MEDIUM'
    })
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    new: jest.fn().mockResolvedValue(mockUser),
    constructor: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser)
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'mockUserId', email: 'test@example.com', role: 'USER' })
  };

  const mockSecurityService = {
    authenticateWithSecurity: jest.fn().mockResolvedValue({
      authenticated: true,
      securityContext: { id: 'securityContextId', securityLevel: 'MEDIUM' }
    })
  };

  beforeEach(async () => {
    jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));
    jest.spyOn(bcrypt, 'compare').mockImplementation((plain, hashed) => 
      Promise.resolve(plain === 'correctPassword')
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: SecurityService,
          useValue: mockSecurityService
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '1h';
              return null;
            })
          }
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    securityService = module.get<SecurityService>(SecurityService);
    userModel = module.get(getModelToken('User'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(null); // No existing user
      const dto = { email: 'new@example.com', password: 'newPassword' };
      
      // Execute
      const result = await service.register(dto);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', expect.any(String));
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });

    it('should throw conflict exception when email already exists', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(mockUser); // Existing user
      const dto = { email: 'existing@example.com', password: 'password' };
      
      // Execute & Assert
      await expect(service.register(dto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const credentials = { email: 'test@example.com', password: 'correctPassword' };
      
      // Execute
      const result = await service.login(credentials);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
    });

    it('should throw unauthorized exception with incorrect password', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const credentials = { email: 'test@example.com', password: 'wrongPassword' };
      
      // Execute & Assert
      await expect(service.login(credentials)).rejects.toThrow();
    });

    it('should throw unauthorized exception when user not found', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(null);
      const credentials = { email: 'nonexistent@example.com', password: 'password' };
      
      // Execute & Assert
      await expect(service.login(credentials)).rejects.toThrow();
    });
  });

  describe('authenticateWithWallet', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(true);
    });

    it('should authenticate with wallet successfully when user exists', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const credentials = {
        walletAddress: '0x1234567890abcdef',
        signature: 'valid-signature',
        message: 'test-message'
      };
      
      // Execute
      const result = await service.authenticateWithWallet(credentials);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(securityService.authenticateWithSecurity).toHaveBeenCalled();
    });

    it('should create and authenticate new user when wallet is not linked to any user', async () => {
      // Setup
      mockUserModel.findOne.mockResolvedValueOnce(null); // No existing user with this wallet
      const credentials = {
        walletAddress: '0x1234567890abcdef',
        signature: 'valid-signature',
        message: 'test-message'
      };
      
      // Execute
      const result = await service.authenticateWithWallet(credentials);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw unauthorized exception when signature is invalid', async () => {
      // Setup
      jest.spyOn(service as any, 'verifySignature').mockResolvedValue(false);
      const credentials = {
        walletAddress: '0x1234567890abcdef',
        signature: 'invalid-signature',
        message: 'test-message'
      };
      
      // Execute & Assert
      await expect(service.authenticateWithWallet(credentials)).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      // Setup
      mockUserModel.findById.mockResolvedValue(mockUser);
      
      // Execute
      const result = await service.verifyToken('valid-token');
      
      // Assert
      expect(result).toHaveProperty('isValid', true);
      expect(result).toHaveProperty('payload');
    });

    it('should return isValid=false when user is not found', async () => {
      // Setup
      mockUserModel.findById.mockResolvedValue(null);
      
      // Execute
      const result = await service.verifyToken('valid-token-unknown-user');
      
      // Assert
      expect(result).toHaveProperty('isValid', false);
    });

    it('should return isValid=false when token verification fails', async () => {
      // Setup
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Execute
      const result = await service.verifyToken('invalid-token');
      
      // Assert
      expect(result).toHaveProperty('isValid', false);
    });
  });

  describe('findUserById', () => {
    it('should find a user by ID', async () => {
      // Setup
      mockUserModel.findById.mockResolvedValue(mockUser);
      
      // Execute
      const result = await service.findUserById('mockUserId');
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password'); // Should not include sensitive data
    });

    it('should throw not found exception when user is not found', async () => {
      // Setup
      mockUserModel.findById.mockResolvedValue(null);
      
      // Execute & Assert
      await expect(service.findUserById('nonexistentId')).rejects.toThrow();
    });
  });
});
