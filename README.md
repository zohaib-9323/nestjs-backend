# NestJS Backend API - Complete Guide

## 📚 Table of Contents

1. [What is NestJS?](#what-is-nestjs)
2. [Project Overview](#project-overview)
3. [Features](#features)
4. [NestJS Core Concepts](#nestjs-core-concepts)
5. [Project Architecture](#project-architecture)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Environment Configuration](#environment-configuration)
9. [Running the Application](#running-the-application)
10. [API Documentation](#api-documentation)
11. [Authentication & Authorization](#authentication--authorization)
12. [Database Schema](#database-schema)
13. [Project Structure](#project-structure)
14. [Testing](#testing)
15. [Common Commands](#common-commands)
16. [Troubleshooting](#troubleshooting)

---

## What is NestJS?

**NestJS** is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It's built with TypeScript and uses modern JavaScript features.

### Why NestJS?

- **Modular Architecture**: Organizes code into modules, making it maintainable
- **TypeScript First**: Built with TypeScript, providing better type safety
- **Dependency Injection**: Built-in dependency injection system
- **Decorators**: Uses decorators (like `@Controller`, `@Service`) to organize code
- **Express Under the Hood**: Uses Express.js (or Fastify) but provides a higher-level abstraction
- **Enterprise Ready**: Designed for large-scale applications

### Key Concepts in NestJS

#### 1. **Modules**
Modules are the basic building blocks of a NestJS application. Each module encapsulates related functionality.

```typescript
@Module({
  imports: [OtherModules],
  controllers: [Controllers],
  providers: [Services],
})
export class AppModule {}
```

#### 2. **Controllers**
Controllers handle incoming HTTP requests and return responses. They define the API endpoints.

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return 'All users';
  }
}
```

#### 3. **Services (Providers)**
Services contain business logic. They're injectable classes that can be used across the application.

```typescript
@Injectable()
export class UsersService {
  findAll() {
    return 'Business logic here';
  }
}
```

#### 4. **Dependency Injection**
NestJS automatically manages dependencies. You declare what you need in the constructor, and NestJS provides it.

```typescript
constructor(private readonly usersService: UsersService) {}
```

#### 5. **Decorators**
Decorators are special functions that add metadata to classes, methods, or properties.

- `@Controller()` - Marks a class as a controller
- `@Get()`, `@Post()`, `@Put()`, `@Delete()` - HTTP method decorators
- `@Injectable()` - Marks a class as a service
- `@Module()` - Marks a class as a module

---

## Project Overview

This is a **Role-Based Access Control (RBAC)** backend API built with NestJS. It provides:

- User registration and authentication
- Role-based authorization (User, Admin, Superadmin)
- Company management system
- Secure superadmin creation
- JWT-based authentication
- MongoDB database integration
- Complete CRUD operations
- Swagger API documentation

---

## Features

### 🔐 Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Three roles with different permissions
  - **USER**: Can create and manage their own companies
  - **ADMIN**: Can manage users and companies
  - **SUPERADMIN**: Full access, cannot be deleted or deactivated
- **Password Hashing**: Passwords are hashed using bcrypt
- **Protected Routes**: Most endpoints require authentication

### 👥 User Management

- User registration (creates USER role by default)
- User login with JWT token
- Get all users (Admin/Superadmin only)
- Update user information
- Delete users (Superadmin only)
- Deactivate users (Admin/Superadmin only)
- Superadmin protection (cannot be deleted/deactivated)

### 🏢 Company Management

- Create companies (authenticated users)
- Get all companies (users see only their own, admins see all)
- Get company by ID
- Update company information
- Delete companies (Admin/Superadmin only)

### 🛡️ Security Features

- Superadmin creation requires secret key
- Only one superadmin can exist
- Superadmin cannot be deleted or deactivated
- JWT token expiration (24 hours)
- Password validation and hashing
- Input validation using class-validator

---

## NestJS Core Concepts Explained

### 1. **Modules**

Think of modules as containers that group related functionality together. Each feature (like Users, Companies, Auth) has its own module.

**Example from our project:**
```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Makes it available to other modules
})
export class UsersModule {}
```

### 2. **Controllers**

Controllers handle HTTP requests. They define the API endpoints and call services to process the request.

**Example:**
```typescript
@Controller('users') // Base route: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get() // GET /users
  findAll() {
    return this.usersService.findAll();
  }

  @Post() // POST /users
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### 3. **Services (Providers)**

Services contain the business logic. They're where you write the actual code that does the work.

**Example:**
```typescript
@Injectable() // Makes it injectable
export class UsersService {
  constructor(
    @InjectModel(User.name) // Injects MongoDB model
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }
}
```

### 4. **DTOs (Data Transfer Objects)**

DTOs define the structure of data that comes in or goes out of your API. They also validate the data.

**Example:**
```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### 5. **Guards**

Guards determine whether a request should be handled by the route handler. They're used for authentication and authorization.

**Example:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard) // Protects the route
@Roles(Role.ADMIN) // Requires ADMIN role
@Get()
findAll() {
  // Only accessible to authenticated ADMIN users
}
```

### 6. **Decorators**

Decorators add metadata to your code. NestJS uses them extensively.

- `@Controller('users')` - Defines a controller with base route
- `@Get()`, `@Post()`, etc. - HTTP method decorators
- `@Body()` - Extracts request body
- `@Param('id')` - Extracts route parameter
- `@Query()` - Extracts query parameters
- `@UseGuards()` - Applies guards
- `@Roles()` - Defines required roles

---

## Project Architecture

```
nestjs-backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── decorators/         # Custom decorators (@Roles, @Public, @CurrentUser)
│   │   ├── guards/             # Authentication & authorization guards
│   │   ├── strategies/         # JWT strategy for Passport
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── auth.controller.ts  # Auth endpoints (login, create superadmin)
│   │   ├── auth.service.ts     # Auth business logic
│   │   └── auth.module.ts      # Auth module definition
│   │
│   ├── users/                   # Users module
│   │   ├── schemas/            # MongoDB schemas
│   │   ├── dto/                # User DTOs
│   │   ├── users.controller.ts # User endpoints
│   │   ├── users.service.ts    # User business logic
│   │   └── users.module.ts     # Users module definition
│   │
│   ├── companies/               # Companies module
│   │   ├── schemas/            # MongoDB schemas
│   │   ├── dto/                # Company DTOs
│   │   ├── companies.controller.ts
│   │   ├── companies.service.ts
│   │   └── companies.module.ts
│   │
│   ├── common/                  # Shared code
│   │   └── enums/              # Role enum
│   │
│   ├── config/                  # Configuration
│   │   └── database.config.ts  # MongoDB connection config
│   │
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Application entry point
│
├── test/                        # E2E tests
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB Atlas account** (free tier works) or local MongoDB
- **Postman** or any API client (optional, Swagger UI included)

---

## Installation & Setup

### Step 1: Clone or Navigate to Project

```bash
cd nestjs-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:
- `@nestjs/core` - Core NestJS framework
- `@nestjs/mongoose` - MongoDB integration
- `@nestjs/jwt` - JWT authentication
- `@nestjs/passport` - Authentication strategy
- `mongoose` - MongoDB ODM (Object Document Mapper)
- `bcrypt` - Password hashing
- `class-validator` - Input validation
- And many more...

### Step 3: Environment Configuration

Create a `.env` file in the root directory (or use the existing one):

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Application
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Superadmin Configuration
SUPERADMIN_SECRET_KEY=your-super-secret-superadmin-key-keep-this-secure
```

**Important**: 
- Replace MongoDB connection string with your actual credentials
- Change JWT_SECRET and SUPERADMIN_SECRET_KEY to secure random strings
- Never commit `.env` file to version control

---

## Running the Application

### Development Mode (with hot-reload)

```bash
npm run start:dev
```

This starts the server with automatic reload on file changes.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Access the Application

- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api`

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.net/db` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `SUPERADMIN_SECRET_KEY` | Secret key to create superadmin | `your-superadmin-key` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `DB_USERNAME` | MongoDB username (if not using URI) | - |
| `DB_PASSWORD` | MongoDB password (if not using URI) | - |
| `DB_CLUSTER` | MongoDB cluster (if not using URI) | - |
| `DB_NAME` | Database name (if not using URI) | `nestjs_backend` |

---

## API Documentation

### Swagger UI

Once the server is running, visit: **http://localhost:3000/api**

Swagger provides:
- Interactive API documentation
- Try-it-out functionality
- Request/response schemas
- Authentication support

### Using Swagger

1. **Login First**: Use `POST /auth/login` to get a JWT token
2. **Authorize**: Click the "Authorize" button (🔒) and enter: `Bearer <your-token>`
3. **Test Endpoints**: All protected endpoints will now work

---

## Authentication & Authorization

### How Authentication Works

1. **User Registration/Login**
   - User provides email and password
   - Password is hashed using bcrypt
   - JWT token is generated and returned

2. **Using JWT Token**
   - Include token in request header: `Authorization: Bearer <token>`
   - Server validates token
   - If valid, request proceeds

3. **Token Structure**
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "role": "user"
   }
   ```

### Role-Based Access Control

#### USER Role
- Can register and login
- Can create companies (for themselves)
- Can view/update their own companies
- Cannot delete companies
- Cannot manage other users

#### ADMIN Role
- All USER permissions
- Can view all users and companies
- Can update any user or company
- Can deactivate users (except superadmin)
- Cannot delete users or companies
- Cannot delete/deactivate superadmin

#### SUPERADMIN Role
- All ADMIN permissions
- Can delete users (except other superadmins)
- Can delete companies
- Cannot be deleted
- Cannot be deactivated
- Created only with secret key

### Protected Endpoints

Most endpoints require authentication. Use the `@Public()` decorator to make endpoints public:

```typescript
@Public()
@Post('register')
register() {
  // This endpoint is public
}
```

### Role Protection

Use the `@Roles()` decorator to restrict access:

```typescript
@Roles(Role.ADMIN, Role.SUPERADMIN)
@Get()
findAll() {
  // Only ADMIN and SUPERADMIN can access
}
```

---

## Database Schema

### User Schema

```typescript
{
  _id: ObjectId,           // MongoDB unique ID
  email: string,           // Unique email
  password: string,         // Hashed password
  firstName: string,
  lastName: string,
  role: Role,              // USER | ADMIN | SUPERADMIN
  isActive: boolean,       // Account status
  createdAt: Date,
  updatedAt: Date
}
```

### Company Schema

```typescript
{
  _id: ObjectId,
  name: string,
  websiteUrl: string,
  phoneNumber: string,
  userId: ObjectId,        // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

### Relationships

- **User → Companies**: One-to-Many (one user can have many companies)
- Companies reference users via `userId` field

---

## Project Structure Explained

### `/src/auth/` - Authentication Module

**Purpose**: Handles all authentication and authorization logic

- **auth.controller.ts**: Login and superadmin creation endpoints
- **auth.service.ts**: Authentication business logic (password validation, JWT generation)
- **strategies/jwt.strategy.ts**: JWT validation strategy for Passport
- **guards/**: Authentication and role-based guards
- **decorators/**: Custom decorators (@Roles, @Public, @CurrentUser)

### `/src/users/` - Users Module

**Purpose**: User management (CRUD operations)

- **users.controller.ts**: User endpoints (register, get, update, delete)
- **users.service.ts**: User business logic (create, find, update, delete)
- **schemas/user.schema.ts**: MongoDB schema definition
- **dto/**: Data Transfer Objects for validation

### `/src/companies/` - Companies Module

**Purpose**: Company management (CRUD operations)

- **companies.controller.ts**: Company endpoints
- **companies.service.ts**: Company business logic
- **schemas/company.schema.ts**: MongoDB schema definition

### `/src/common/` - Shared Code

**Purpose**: Code shared across modules

- **enums/role.enum.ts**: Role definitions (USER, ADMIN, SUPERADMIN)

### `/src/config/` - Configuration

**Purpose**: Application configuration

- **database.config.ts**: MongoDB connection configuration

### `/src/main.ts` - Application Entry Point

**Purpose**: Bootstraps the NestJS application

- Creates the NestJS application
- Sets up global validation
- Configures Swagger documentation
- Starts the server

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:cov
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Files

- Unit tests: `*.spec.ts` files next to source files
- E2E tests: `/test/` directory

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start in development mode (watch mode) |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start in production mode |
| `npm run build` | Build the application |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Lint and fix code |

---

## API Endpoints Reference

### Authentication

#### `POST /auth/login`
Login and get JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### `POST /auth/create-superadmin`
Create superadmin (requires secret key)

**Request:**
```json
{
  "email": "superadmin@example.com",
  "password": "SecurePassword123!",
  "firstName": "Super",
  "lastName": "Admin",
  "secretKey": "your-superadmin-secret-key"
}
```

### Users

#### `POST /users/register` (Public)
Register a new user

#### `GET /users` (Admin/Superadmin)
Get all users

#### `GET /users/:id` (Admin/Superadmin)
Get user by ID

#### `PUT /users/:id` (Admin/Superadmin)
Update user

#### `DELETE /users/:id` (Superadmin only)
Delete user

#### `PUT /users/:id/deactivate` (Admin/Superadmin)
Deactivate user

### Companies

#### `POST /companies` (Authenticated)
Create a new company

**Request:**
```json
{
  "name": "Acme Corporation",
  "websiteUrl": "https://acme.com",
  "phoneNumber": "+1234567890",
  "userId": "user-id"
}
```

#### `GET /companies` (Authenticated)
Get all companies (users see only their own)

#### `GET /companies/:id` (Authenticated)
Get company by ID

#### `PUT /companies/:id` (Authenticated)
Update company

#### `DELETE /companies/:id` (Admin/Superadmin)
Delete company

---

## Step-by-Step Usage Guide

### 1. Start the Server

```bash
npm run start:dev
```

### 2. Create Superadmin (First Time Only)

```bash
POST http://localhost:3000/auth/create-superadmin
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperSecure123!",
  "firstName": "Super",
  "lastName": "Admin",
  "secretKey": "your-superadmin-secret-key-from-env"
}
```

### 3. Login as Superadmin

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "SuperSecure123!"
}
```

Copy the `accessToken` from the response.

### 4. Use the Token

Include the token in all subsequent requests:

```bash
Authorization: Bearer <your-access-token>
```

### 5. Register Regular Users

```bash
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 6. Create Companies

```bash
POST http://localhost:3000/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Company",
  "websiteUrl": "https://mycompany.com",
  "phoneNumber": "+1234567890",
  "userId": "your-user-id"
}
```

---

## Troubleshooting

### Issue: "Superadmin secret key not configured"

**Solution**: Make sure `SUPERADMIN_SECRET_KEY` is set in your `.env` file and restart the server.

### Issue: "Cannot connect to MongoDB"

**Solution**: 
- Check your MongoDB connection string in `.env`
- Ensure MongoDB Atlas allows connections from your IP
- Verify username and password are correct

### Issue: "JWT token expired"

**Solution**: Login again to get a new token. Tokens expire after 24 hours.

### Issue: "Forbidden" errors

**Solution**: 
- Check if you're using the correct role
- Verify your JWT token is valid
- Ensure you've included `Bearer` prefix in Authorization header

### Issue: Port already in use

**Solution**: 
- Change `PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

---

## Key Technologies Used

### Backend Framework
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe JavaScript

### Database
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling

### Authentication
- **JWT (JSON Web Tokens)**: Token-based authentication
- **Passport.js**: Authentication middleware
- **bcrypt**: Password hashing

### Validation
- **class-validator**: Decorator-based validation
- **class-transformer**: Object transformation

### Documentation
- **Swagger/OpenAPI**: API documentation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library

---

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive information
2. **Use strong passwords** - For JWT_SECRET and SUPERADMIN_SECRET_KEY
3. **Change default secrets** - Don't use example values in production
4. **HTTPS in production** - Always use HTTPS for production
5. **Rate limiting** - Consider adding rate limiting for production
6. **Input validation** - Always validate user input (already implemented)
7. **Password hashing** - Passwords are hashed using bcrypt (already implemented)

---

## Next Steps

1. **Add more features**:
   - Email verification
   - Password reset
   - File upload
   - Pagination
   - Search and filtering

2. **Improve security**:
   - Rate limiting
   - CORS configuration
   - Helmet for security headers
   - Request logging

3. **Deploy**:
   - Deploy to cloud platforms (AWS, Heroku, DigitalOcean)
   - Set up CI/CD pipeline
   - Configure production environment variables

---

## Support & Resources

### Official Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)

### Learning Resources
- [NestJS Fundamentals](https://docs.nestjs.com/fundamentals/custom-providers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## License

This project is private and proprietary.

---

## Author

Built with ❤️ using NestJS

---

**Happy Coding! 🚀**
# nestjs-backend
